import { promises as fs } from 'fs'
import path from 'path'
import { Message, Collection } from 'discord.js'

export type HandlerParameters = {args: string[], msg: Message}

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
      const command: Command = new (await import(path.join('../..', cmdFolder, file))).default()
      for (const cmd of [command.name, ...[command.alias].flat()]) {
        if (!!cmd) commandList.set(cmd, command)
      }
    }
  }

  return commandList
}
