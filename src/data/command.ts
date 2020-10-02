import { Message, MessageMentions, PermissionResolvable } from 'discord.js'
import { promises as fs } from 'fs'
import Path from 'path'
import db from '../utils/db'
import { SingleOrMany } from '../utils/utils'
import { CommandError } from './errors'


const argsRegex = /[^\s"]+|(?<!\\)"([^"]*|.+\\".+)(?<!\\)"/g

export enum Argument {
  String,
  Number,
  TextChannel,
  VoiceChannel,
  CategoryChannel,
  Member,
}

export type RunnerParameters = { args: any[], message: Message, send: (msg: string) => void }

export abstract class Command {
  abstract name: string
  abstract description: string

  aliases: string[] = []
  arguments: (Argument | Argument[])[]  = []
  permissions: SingleOrMany<PermissionResolvable> = []
  subcommands: Map<String, Command> = new Map()

  abstract run?(parameters: RunnerParameters): any

  addSubcommand(subcommand: Command) {
    const names = [subcommand.name, ...subcommand.aliases]
    for (const name of names) {
      if (!this.subcommands.has(name)) {
        this.subcommands.set(name, subcommand)
      } else {
        throw new Error(`Duplicated subcommand '${name}' for command '${this.name}'`)
      }
    }
  }
}

export class Commander {
  commands = new Map<string, Command>()
  messages = new Map<string, string>()

  addCommand = (command: Command) => {
    this.#addCommand(command.name, command)
    for (const alias of command.aliases) {
      this.#addCommand(alias, command)
    }
  }

  #addCommand = (name: string, command: Command) => {
    if (!this.commands.has(name)) {
      this.commands.set(name, command)
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
            this.addCommand(new command())
          } catch (e) {
            console.warn(`Failed loading command: ${file}\n${e}`)
          }
        }
      })
    )
  }

  handle = async (msg: Message, oldMsg?: Message) => {
    if (msg.partial) return

    // Removes bot reactions from edited messages, as they will be re-ran
    if (!!oldMsg && msg.author.id != msg.client.user?.id) {
      oldMsg.reactions.cache.forEach(reaction => {
        reaction.users.remove(msg.client.user?.id)
      })
    }

    const prefix: string = (msg.channel.type == 'text' && (await db(msg.guild!.id).get('prefix'))) ?? process.env.PREFIX
    const mentionMatch = MessageMentions.USERS_PATTERN.exec(msg.content)

    let sMsg
    if (msg.content.startsWith(prefix)) {
      sMsg = msg.content.substr(prefix.length)
    } else if (mentionMatch && mentionMatch[1] == msg.client.user?.id) {
      sMsg = msg.content.substr(mentionMatch[0].length).trimStart()
    } else {
      return
    }

    let args: any[] = Array.from(sMsg.matchAll(argsRegex)).map((match) => match[1] ?? match[0])

    let command = this.commands.get(args[0])
    let permissions: PermissionResolvable[] = []

    const send = async (message: string): Promise<Message> => {
      if (!!oldMsg) {
        const oldCommandID = this.messages.get(oldMsg.id)
        if (!!oldCommandID) {
          const oldCommand = msg.channel.messages.cache.get(oldCommandID)
          if (oldCommand) {
            oldCommand.edit(message)
            oldCommand.reactions.removeAll()
            return oldCommand
          }
        }
      }

      const cmdMessage = await msg.channel.send(message)
      this.messages.set(msg.id, cmdMessage.id)
      return cmdMessage
    }

    if (!!command) {
      try {
        permissions.push(command.permissions)
        args = args.slice(1)
        while (command?.subcommands.size != 0) {
          if (command.subcommands.has(args[0])) {
            command = command.subcommands.get(args[0])!
            args = args.slice(1)
          } else if (!command.run) {
            throw new CommandError('Invalid usage!')
          } else {

            break
          }
        }

        permissions = permissions.flat(Infinity)

        if (permissions.some((permission) => !msg.member?.hasPermission(permission))) {
          send(`${msg.member}, You don't have permission to use this command.`)
          return
        }

        if (!!command.arguments) {
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
                  if (!!channel) {
                    args[index] = channel
                  } else {
                    throw new CommandError(`No channel "${args[index]}" found.`)
                  }
                  break
                case Argument.Member:
                  const member = msg.guild?.members.cache.find(member => member.displayName.includes(args[index]))
                  if (!!member) {
                    args[index] = member
                  } else {
                    throw new CommandError(`No member "${args[index]}" found.`)
                  }
                  break
              }
            }
          })
        }

        command.run!({ args, message: msg, send })

      } catch (e) {
        if (e instanceof CommandError) {
          const message = await send(`${msg.member}, ${e.message}`)
          setTimeout(() => message.delete(), 10000)
          return
        } else {
          throw e
        }
      }
    }
  }
}
