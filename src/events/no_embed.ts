import { EventListener } from '../data/event'

const NoEmbeds: EventListener<'message'> = {
  event: 'message',
  handle: async (message) => {
    if (message.content.includes('https://parsec.gg/g/')) {
      message.suppressEmbeds()
    }
  },
}

export { NoEmbeds }
