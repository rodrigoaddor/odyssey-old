import { CategoryChannel } from 'discord.js'
import { Command, Argument } from '../data/command'
import db from '../utils/db'

export default <Command>{
  name: 'room',
  arguments: [Argument.String],
  run: async ({ args, message: msg, send }) => {
    const channel = msg.member?.voice?.channel
    if (!!channel) {
      const owner = await db(channel.id).get('owner')
      if (owner == msg.member?.id || msg.member?.hasPermission('MANAGE_CHANNELS')) {
        channel.setName(args.join(' '))
      } else {
        send(`You are not the owner of the voice channel you are in.`)
      }
    } else {
      send(`You need to be in a voice channel to do that.`)
    }
  },
  subCommands: {
    setCategory: {
      arguments: [Argument.CategoryChannel],
      permission: 'MANAGE_CHANNELS',
      run: async ({ args, message, send }) => {
        const channel = args[0] as CategoryChannel
        if (!!channel) {
          db(message.guild!.id).set('rooms', channel.id)
          send(`Set rooms category to <#${channel.id}>.`)
        } else {
          const currentChannel = await db(message.guild!.id).get('rooms')
          if (!!currentChannel) {
            send(`Using category <#${currentChannel}> as rooms category.`)
          } else {
            send(`No category defined.`)
          }
        }
      },
    },
  },
}
