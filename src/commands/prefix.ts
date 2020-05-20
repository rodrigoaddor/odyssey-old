import db from '../db'
import { Command, HandlerParameters } from '../data/command'

export default class Prefix implements Command {
  name = 'prefix'

  handle = async ({ msg, args }: HandlerParameters) => {
    const prefix: string = (await db.get(`${msg.guild!.id}-prefix`)) || process.env.PREFIX!
    if (args.length == 1) {
      if (!!prefix) {
        msg.reply(`This server's current prefix is ${prefix}`)
      } else {
        msg.reply(
          `This server doesn't have a prefix set. You scan still mention me by using <@${msg.client.user!.id}>.`
        )
      }
    } else {
      if (msg.member?.hasPermission('MANAGE_GUILD')) {
        if (['remove', 'unset', 'delete'].includes(args[1].toLowerCase())) {
          db.delete(`${msg.guild!.id}-prefix`)
          msg.reply(`Removed the prefix.`)
        } else {
          await db.set(`${msg.guild!.id}-prefix`, args[1])
          msg.reply(`Set prefix to ${args[1]}`)
        }
      } else {
        msg.reply(`You don't have permission to do that.`)
      }
    }
  }
}
