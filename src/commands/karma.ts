import { GuildMember } from 'discord.js'
import { Argument, Command, RunnerParameters } from '../data/command'
import db from '../utils/db'

export default class KarmaCommand extends Command {
  name = 'karma'
  description = "View an user's karma"
  arguments = [Argument.Member]

  async run({ send, args, message: {guild} }: RunnerParameters){
    if (!guild) return
    const member: GuildMember = args[0]
    const karma = await db(`${guild.id}-karma`).get(member.id)
    send(`${member} has ${karma ?? 0} karma.`)
  }
}
