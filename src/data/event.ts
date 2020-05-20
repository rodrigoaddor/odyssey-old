import { promises as fs } from 'fs'
import path from 'path'
import { Collection, ClientEvents } from 'discord.js'

export interface EventListener<K extends string & keyof ClientEvents> {
  readonly name: K
  readonly handle: (...args: ClientEvents[K]) => void
}

export const eventList = new Collection<String, EventListener<any>>()

const eventsFolder = process.env.EVENTSS_PATH || './src/events'

export async function loadEvents() {
  const files = await fs.readdir(eventsFolder)
  for (const file of files) {
    if (file.match(/.[tj]s$/)) {
      const event: EventListener<any> = (await import(path.join('../..', eventsFolder, file))).default
      if (!!event.name) eventList.set(event.name, event)
    }
  }

  return eventList
}
