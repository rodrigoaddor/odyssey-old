import { promises as fs } from 'fs'
import path from 'path'
import { Message, Collection, PermissionResolvable } from 'discord.js'
import db from '../db'
import { CommandError } from './errors'

const argsRegex = /[^\s"]+|(?<!\\)"([^"]*|.+\\".+)(?<!\\)"/g

export enum Argument {
  String,
  Number,
  TextChannel,
  VoiceChannel,
  CategoryChannel,
}

export interface Command {
  // readonly name: string
  readonly alias?: string | string[]
  readonly arguments?: Array<Argument>
  readonly permission?: PermissionResolvable | PermissionResolvable[]
  readonly handle: (parameters: { args: any[]; message: Message }) => Promise<any>
}

export const commandList = new Collection<String, { [key: string]: Command }>()

const cmdFolder = process.env.COMMANDS_PATH || './src/commands'

export async function loadCommands() {
  const files = await fs.readdir(cmdFolder)
  for (const file of files) {
    if (file.match(/.[tj]s$/)) {
      const commands = await import(path.join('../..', cmdFolder, file))
      commandList.set(file.split('.')[0], commands)
    }
  }

  return commandList
}

export async function handler(message: Message) {
  const prefix: string = (await db.get(`${message.guild!.id}-prefix`)) ?? process.env.PREFIX
  const botMention = `<@${message.client.user!.id}>`

  let msg
  if (message.content.startsWith(prefix)) {
    msg = message.content.substr(prefix.length)
  } else if (message.content.startsWith(botMention)) {
    msg = message.content.substr(botMention.length).trimStart()
  } else {
    return
  }

  let args: any[] = Array.from(msg.matchAll(argsRegex)).map((match) => match[1] ?? match[0])

  const cmds = commandList.get(args[0])
  if (!!cmds) {
    let cmd: Command
    if (!!cmds[args[1]]) {
      cmd = cmds[args[1]]
      args = args.slice(2)
    } else if (!!cmds['default']) {
      cmd = cmds['default']
      args = args.slice(1)
    } else {
      message.reply(`Invalid usage.`)
      return
    }

    if (!!cmd.permission) {
      const permissions = Array.isArray(cmd.permission) ? cmd.permission : [cmd.permission]
      if (!permissions.every((permission) => message.member?.hasPermission(permission))) {
        message.reply(`You don't have permission to use this command.`)
        return
      }
    }

    if (!!cmd.arguments) {
      try {
        cmd.arguments.forEach((argument, index) => {
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
                const channel = message.guild?.channels.cache.find(
                  (channel) => channel.type == 'category' && (channel.id == args[index] || channel.name == args[index])
                )
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
          message.reply(e.message)
        } else {
          throw e
        }
      }
    }

    cmd.handle({ args, message })
  }
}
