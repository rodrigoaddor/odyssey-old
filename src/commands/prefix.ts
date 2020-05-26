import { Command, Argument } from '../data/command'
import db from '../utils/db'

const Prefix: Command = {
  handle: async ({ message: msg }) => {
    const prefix: string = (await db(msg.guild!.id).get('prefix')) ?? process.env.PREFIX
    if (!!prefix) {
      msg.reply(`This server's current prefix is set to ${prefix}`)
    } else {
      msg.reply(`This server doesn't have a prefix set. You can still mention me by using <@${msg.client.user?.id}>`)
    }
  },
}

const set: Command = {
  arguments: [Argument.String],
  permission: 'MANAGE_GUILD',
  handle: async ({ args: [prefix], message: msg }) => {
    await db(msg.guild!.id).set('prefix', prefix)
    msg.reply(`Set prefix to ${prefix}`)
  },
}

export default Prefix
export { set }
