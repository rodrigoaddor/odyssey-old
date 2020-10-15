import { EventListener } from '../data/event'
import db from '../utils/db'

const RoomJoinOrLeave: EventListener<'voiceStateUpdate'> = {
  event: 'voiceStateUpdate',
  handle: async (oldState, newState) => {
    const { guild: oldGuild } = oldState
    if (!!newState.channel && newState.channelID != oldState.channelID) {
      const { member, channel, guild } = newState
      const roomsCategory: string = await db(guild.id).get('rooms')

      if (channel?.parentID == roomsCategory && channel.members.array().length == 1) {
        db(channel.id).set('owner', member!.id)
        if (member?.presence && member.presence.activities.some((activity) => activity.type == 'PLAYING')) {
          await channel?.setName(member.presence.activities.find((activity) => activity.type == 'PLAYING')!.name)
        } else {
          await channel?.setName(`${member?.displayName}'s room`)
        }
        if (!channel.parent?.children.some((channel) => channel.members.array().length == 0)) {
          await channel.guild.channels.create('New Room', {
            type: 'voice',
            parent: roomsCategory,
          })
        }
      }
    }

    if (oldState.channel?.parentID == (await db(oldGuild.id).get('rooms'))) {
      const { member, channel, guild } = oldState
      const roomsCategory: string = await db(guild.id).get('rooms')

      if (channel?.parentID == roomsCategory && channel.members.array().length == 0) {
        db(channel.id).delete('owner')
        if (channel.parent?.children.some((c) => c.members.array().length == 0 && c.id != channel.id)) {
          await channel.delete()
        } else {
          await channel.edit({
            name: 'New Room',
            position: channel.parent?.children.array().length! - 1,
          })
        }
      }
    }
  },
}

const RoomPresence: EventListener<'presenceUpdate'> = {
  event: 'presenceUpdate',
  handle: async (oldPresence, newPresence) => {
    const { member, guild } = newPresence
    const channel = member?.voice.channel
    const roomsCategory: string = await db(guild!.id).get('rooms')

    if (channel && channel.parentID == roomsCategory) {
      const oldActivity = !!oldPresence && oldPresence.activities.find((activity) => activity.type == 'PLAYING')
      const channelName = channel.name
      if (channelName == `${member?.displayName}'s room` || (oldActivity && channelName == oldActivity.name)) {
        const newActivity = newPresence.activities.find((activity) => activity.type == 'PLAYING')
        if (!!newActivity) {
          channel.setName(newActivity.name)
        } else {
          channel.setName(`${member?.displayName}'s room`)
        }
      }
    }
  },
}

export { RoomJoinOrLeave, RoomPresence }
