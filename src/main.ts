import { Client } from 'discord.js'

import { loadCommands, handler } from './data/command'
import { loadEvents } from './data/event'

const client = new Client({
  presence: {
    status: 'idle',
  },
})

loadCommands().then((commandList) => {
  client.on('message', async (message) => {
    handler(message)
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
