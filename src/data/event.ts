import { promises as fs } from 'fs'
import path from 'path'
import { Collection, ClientEvents } from 'discord.js'

export interface EventListener<K extends keyof ClientEvents> {
  readonly event: K
  readonly handle: (...args: ClientEvents[K]) => void
}

function isEventListener(obj: any): obj is EventListener<any> {
  return !!obj?.event && !!obj?.handle
}

export const eventList: EventListener<keyof ClientEvents>[] = []

const eventsFolder = process.env.EVENTSS_PATH || './src/events'

export async function loadEvents() {
  const files = await fs.readdir(eventsFolder)
  for (const file of files) {
    if (file.match(/.[tj]s$/) && file.substr(0, 1) != '_') {
      const events = await import(path.join('../..', eventsFolder, file))
      for (const event of Object.values(events)) {
        if (isEventListener(event) && !!event.event) {
          eventList.push(event)
        }
      }
    }
  }

  return eventList
}
