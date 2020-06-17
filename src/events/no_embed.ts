import { EventListener } from '../data/event'

const NoEmbeds: EventListener<'message'> = {
  name: 'message',
  handle: async (message) => {
    if (message.content.includes('https://parsec.gg/g/')) {
      message.suppressEmbeds()
    }
  },
}

export { NoEmbeds }
