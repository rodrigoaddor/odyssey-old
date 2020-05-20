import { Command, HandlerParameters } from '../data/command'
import db from '../db'

export default class Room implements Command {
  name = 'room'

  handle = async ({ msg, args }: HandlerParameters) => {
    const prefix = (await db.get(`${msg.guild!.id}-prefix`)) || {}
    const roomsCategory = (await db.get(`${msg.guild!.id}-rooms`)) || {}
    if (args.length >= 1) {
      if (args[1] == 'name') {
        if (!!args[2]) {
          const channel = msg.member?.voice?.channel
          if (!!channel) {
            const owner = await db.get(`${channel.id}-owner`)
            if (owner == msg.member?.id) {
              channel.setName(args.slice(2).join(' '))
            } else {
              msg.reply(`You are not the owner of the voice channel you are in.`)
            }
          } else {
            msg.reply(`You need to be in a voice channel to do this.`)
          }
        } else {
          msg.reply(`Incorrect usage.`)
        }
      } else if (args[1] == 'category') {
        if (!!args[2]) {
          if (msg.member?.hasPermission('MANAGE_GUILD')) {
            const room = msg.guild?.channels.cache.find(
              (channel) => channel.type == 'category' && (channel.name == args[2] || channel.id == args[2])
            )

            if (!!room) {
              db.set(`${msg.guild!.id}-rooms`, room.id)
              msg.reply(`Set rooms category to <#${room.id}>.`)
            } else {
              msg.reply(`No categories found.`)
            }
          } else {
            msg.reply(`You don't have permission to do that.`)
          }
        } else {
          if (!!roomsCategory) {
            msg.reply(`Using category <#${roomsCategory}> as rooms category.`)
          } else {
            msg.reply(`No category defined. Set with _${prefix}room category <category name/id>_`)
          }
        }
      }
    } else {
      msg.reply(`Incorrect usage.`)
    }
  }
}
