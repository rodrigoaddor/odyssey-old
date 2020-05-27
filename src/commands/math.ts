import { Command, Argument } from '../data/command'
import { create, all } from 'mathjs'

const math = create(all, { number: 'BigNumber', precision: 64 })

const Math: Command = {
  arguments: [Argument.String],
  handle: async ({ args, send }) => {
    const allArgs = args.join(' ')
    if (allArgs.length > 0 && !!math && !!math.evaluate) {
      send(math.evaluate(allArgs).toString())
    } else {
      send('Internal error')
    }
  },
}

export default Math
