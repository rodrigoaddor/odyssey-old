import { Command, Argument } from '../data/command'
import { create, all } from 'mathjs'

const math = create(all, { number: 'BigNumber', precision: 64 })

export default <Command>{
  name: 'math',
  arguments: [Argument.String],
  run: async ({ args, send }) => {
    const allArgs = args.join(' ')
    try {
      if (allArgs.length > 0 && !!math && !!math.evaluate) {
        send(math.evaluate(allArgs).toString())
      } else {
        send('Internal error')
      }
    } catch (e) {
      send('Internal error')
    }
  },
}
