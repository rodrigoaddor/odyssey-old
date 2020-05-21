import { promises as fs } from 'fs'
import path from 'path'
import { Message, Collection } from 'discord.js'

export type HandlerParameters = { args: string[]; msg: Message }

export interface Command {
  readonly name: string
  readonly alias?: string | string[]
  readonly handle: (parameters: HandlerParameters) => Promise<any>
}

export const commandList = new Collection<String, Command>()

const cmdFolder = process.env.COMMANDS_PATH || './src/commands'

export async function loadCommands() {
  const files = await fs.readdir(cmdFolder)
  for (const file of files) {
    if (file.match(/.[tj]s$/)) {
      const commands = await import(path.join('../..', cmdFolder, file))
      for (const command of Object.values(commands) as Command[]) {
        if (!!command.name) {
          commandList.set(command.name, command)
        }
      }
    }
  }

  return commandList
}
