import { EventListener } from '../data/event'
import db from '../db'

const Rooms: EventListener<'voiceStateUpdate'> = {
  name: 'voiceStateUpdate',
  handle: async (oldState, newState) => {
    if (!!newState.channel) {
      const { member, channel, guild } = newState
      const roomsCategory: string = await db.get(`${guild.id}-rooms`)

      if (channel?.parentID == roomsCategory && channel.members.array().length == 1) {
        db.set(`${channel.id}-owner`, member!.id)
        if (member?.presence && member.presence.activities.some((activity) => activity.type == 'PLAYING')) {
          channel?.setName(member.presence.activities.find((activity) => activity.type == 'PLAYING')!.name)
        } else {
          channel?.setName(`${member?.displayName}'s room`)
        }
        if (!channel.parent?.children.some(channel => channel.members.array().length == 0)) {
          channel.guild.channels.create('New Room', {
            type: 'voice',
            parent: roomsCategory
          })
        }
      }
    } else {
      const { member, channel, guild } = oldState
      const roomsCategory: string = await db.get(`${guild.id}-rooms`)

      if (channel?.parentID == roomsCategory) {
        if (channel.members.array().length == 0) {
          channel.delete()
          db.delete(`${channel.id}-owner`)
        }
      }
    }
  },
}

export default Rooms
