import { promises as fs } from 'fs'
import Path from 'path'

import { Message, Collection, PermissionResolvable, PartialMessage, MessageMentions } from 'discord.js'
import db from '../utils/db'
import { CommandError } from './errors'

const argsRegex = /[^\s"]+|(?<!\\)"([^"]*|.+\\".+)(?<!\\)"/g

export enum Argument {
  String,
  Number,
  TextChannel,
  VoiceChannel,
  CategoryChannel,
}

export interface CommandRunner {
  (parameters: { args: any[]; message: Message; send: (msg: string) => void }): Promise<any>
}

export interface SubCommand {
  arguments?: Array<Argument>
  permission?: PermissionResolvable | PermissionResolvable[]
  run: CommandRunner
}

export interface Command extends Partial<SubCommand> {
  name: string
  subCommands?: { [key: string]: SubCommand }
}

const isCommand = (obj: any): obj is Command => !!obj.name// && !!obj.run

export class Commander {
  commands = new Map<string, Command>()
  messages = new Map<string, string>()

  constructor() {}

  addCommand = (command: Command) => {
    if (!this.commands.has(command.name)) {
      this.commands.set(command.name, command)
    } else {
      throw new Error(`Duplicated command: ${command.name}`)
    }
  }

  loadCommands = async (path: string) => {
    const files = await fs.readdir(path)
    await Promise.all(
      files.map(async (file) => {
        if (file.match(/.[tj]s$/) && file.substr(0, 1) != '_') {
          try {
            const { default: command } = await import(Path.resolve(Path.join(path, file)))
            if (isCommand(command)) {
              this.addCommand(command)
            }
          } catch (e) {
            console.warn(`Failed loading command: ${file}`)
          }
        }
      })
    )
  }

  handle = async (msg: Message, oldMsg?: Message) => {
    if (msg.partial) return

    const prefix: string = (await db(msg.guild!.id).get('prefix')) ?? process.env.PREFIX
    const mentionMatch = MessageMentions.USERS_PATTERN.exec(msg.content ?? '')

    let sMsg
    if (msg.content.startsWith(prefix)) {
      sMsg = msg.content.substr(prefix.length)
    } else if (mentionMatch && mentionMatch[1] == msg.client.user?.id) {
      sMsg = msg.content.substr(mentionMatch[0].length).trimStart()
    } else {
      return
    }

    let args: any[] = Array.from(sMsg.matchAll(argsRegex)).map((match) => match[1] ?? match[0])

    const command = this.commands.get(args[0])
    if (!!command) {
      let subCommand: SubCommand | undefined
      if (!!command.subCommands?.[args[1]]) {
        subCommand = command.subCommands[args[1]]
        args = args.slice(2)
      } else if (!!command.run) {
        args = args.slice(1)
      } else {
        msg.reply(`Invalid usage.`)
        return
      }

      let runner = subCommand?.run || (command.run as CommandRunner)

      const permissions = [command.permission, subCommand?.permission]
        .flat()
        .filter((a) => !!a) as PermissionResolvable[]

      if (permissions.some((permission) => !msg.member?.hasPermission(permission))) {
        msg.reply(`You don't have permission to use this command.`)
        return
      }

      if (!!command.arguments) {
        try {
          command.arguments.forEach((argument, index) => {
            if (args[index] != undefined) {
              switch (argument) {
                case Argument.Number:
                  const number = parseFloat(args[index])
                  if (!isNaN(number)) {
                    args[index] = number
                  } else {
                    throw new CommandError()
                  }
                  break
                case Argument.CategoryChannel:
                  const channel = msg.guild?.channels.cache.find(
                    (channel) =>
                      channel.type == 'category' && (channel.id == args[index] || channel.name == args[index])
                  )
                  console.log(channel)
                  if (!!channel) {
                    args[index] = channel
                  } else {
                    throw new CommandError(`No channel "${args[index]}" found.`)
                  }
                  break
              }
            }
          })
        } catch (e) {
          if (e instanceof CommandError) {
            msg.reply(e.message)
          } else {
            throw e
          }
        }
      }

      const send = (message: string) => {
        if (!!oldMsg) {
          const oldCommandID = this.messages.get(oldMsg.id)
          if (!!oldCommandID) {
            const oldCommand = msg.channel.messages.cache.get(oldCommandID)
            if (oldCommand) {
              oldCommand.edit(message)
              oldCommand.reactions.removeAll()
              return
            }
          }
        }

        msg.channel.send(message).then((cmdMessage) => {
          this.messages.set(msg.id, cmdMessage.id)
        })
      }

      runner({ args, message: msg, send })
    }
  }
}
