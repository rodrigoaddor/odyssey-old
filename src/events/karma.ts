import { EventListener } from '../data/event'
import db from '../utils/db'

const KarmaAdd: EventListener<'messageReactionAdd'> = {
  event: 'messageReactionAdd',
  handle: async ({
    emoji: { name: emoji },
    message: { member: author, guild },
  }) => {
    if (!['upvote', 'downvote'].includes(emoji) || !guild || !author) return

    const karmaDB = db(`${guild.id}-karma`)
    const karma: number = await karmaDB.get(author.id)

    console.log('Handling karma')

    if (emoji == 'upvote') {
      await karmaDB.set(author.id, karma + 1)
      console.log(`Added 1 karma to ${author}`)
    } else if (emoji == 'downvote') {
      await karmaDB.set(author.id, karma - 1)
      console.log(`Removed 1 karma from ${author}`)
    }
  },
}

const KarmaRemove: EventListener<'messageReactionRemove'> = {
  event: 'messageReactionRemove',
  handle: async ({
    emoji: { name: emoji },
    message: { member: author, guild },
  }) => {
    if (!['upvote', 'downvote'].includes(emoji) || !guild || !author) return

    const karmaDB = db(`${guild.id}-karma`)
    const karma: number = await karmaDB.get(author.id)

    if (emoji == 'upvote') {
      karmaDB.set(author.id, karma - 1)
    } else if (emoji == 'downvote') {
      karmaDB.set(author.id, karma + 1)
    }
  },
}

export { KarmaAdd, KarmaRemove }
