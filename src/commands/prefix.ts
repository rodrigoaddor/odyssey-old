import { PermissionResolvable } from 'discord.js'
import { Command, RunnerParameters } from '../data/command'
import db from '../utils/db'

export default class PrefixCommand extends Command {
  name = 'prefix'
  description = 'Check or set the server\'s prefix.'

  constructor() {
    super()
    this.addSubcommand(new SetPrefixCommand())
  }

  async run({ message, send }: RunnerParameters) {
    const prefix: string = (await db(message.guild!.id).get('prefix')) ?? process.env.PREFIX
    if (!!prefix) {
      send(`This server's current prefix is set to ${prefix}`)
    } else {
      send(`This server doesn't have a prefix set. You can still mention me by using <@${message.client.user?.id}>`)
    }
  }
}

class SetPrefixCommand extends Command {
  name = 'set'
  description = 'Set the server\'s prefix.'

  permissions: PermissionResolvable = 'MANAGE_GUILD'

  async run({ message, send, args: [prefix] }: RunnerParameters) {
    await db(message.guild!.id).set('prefix', prefix)
    send(`Set prefix to ${prefix}`)
  }
}