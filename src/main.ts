import { Client, Message } from 'discord.js'

import { Commander } from './data/command'
import { loadEvents } from './data/event'

const client = new Client({
  presence: {
    status: 'idle',
  },
})

const commander = new Commander()
commander.loadCommands(process.env.COMMANDS_PATH ?? './src/commands').then(() => {
  client.on('message', commander.handle)
  client.on('messageUpdate', (oldMsg, newMsg) => commander.handle(newMsg as Message, oldMsg as Message))

  console.log(`Loaded ${commander.commands.size} commands.`)
})

loadEvents().then((eventList) => {
  eventList.forEach(({ name, handle }) => {
    client.on(name, handle)
  })
  console.log(`Loaded ${eventList.array().length} events.`)
})

client.once('ready', () => {
  console.log(`Logged in as ${client.user!.tag}! (${client.user!.id})`)
  client.user?.setPresence({ status: 'dnd', activity: { type: 'PLAYING', name: 'with code' } })
})

client.on('error', console.error)

client.login(process.env.TOKEN)
