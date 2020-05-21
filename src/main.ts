import { Client } from 'discord.js'
import db from './db'
import { CommandError, CommandErrorType } from './data/errors'

import { loadCommands } from './data/command'
import { loadEvents } from './data/event'

const client = new Client({
  presence: {
    status: 'idle',
  },
})

loadCommands().then((commandList) => {
  client.on('message', async (message) => {
    const { content: msg, guild } = message
    const prefix: string = (await db.get(`${guild?.id!}-prefix`)) || process.env.PREFIX
    const [match, mention] = Array.from(msg.match(/^<@[!&]?(\d+)>/) || [])
    if (
      (!!prefix && msg.startsWith(prefix)) ||
      mention == client.user?.id ||
      mention == message.guild?.me?.roles.cache.find((role) => role.managed)?.id
    ) {
      const args = (
        (prefix && msg.startsWith(prefix) ? msg.substr(prefix.length) : mention && msg.substr(match.length)) || msg
      )
        .split(' ')
        .filter((str) => str.length > 0)
      if (commandList.has(args[0])) {
        commandList
          .get(args[0])
          ?.handle({
            args: args.slice(0),
            msg: message,
          })
          .catch((e) => {
            if (e instanceof CommandError) {
              const { message: msg, type } = e
              message.reply(`${type}${!!msg ? ':' : '.'} ${!!msg ? msg : ''}`)
            } else {
              throw e
            }
          })
      }
    }
  })
  console.log(`Loaded ${commandList.array().length} commands.`)
})

loadEvents().then((eventList) => {
  eventList.forEach(({ name, handle }) => {
    client.on(name, handle)
  })
  console.log(`Loaded ${eventList.array().length} events.`)
})

client.once('ready', () => {
  console.log(`Logged in as ${client.user!.tag}! (${client.user!.id})`)
})

client.on('error', console.error)

client.login(process.env.TOKEN).then(() => {
  client.user?.setPresence({
    status: 'online',
  })
})
