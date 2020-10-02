import { Command, RunnerParameters } from '../data/command'

export default class PingCommand extends Command {
  name = 'ping'
  description = 'Pong?!'

  run({send}: RunnerParameters) {
    send('Pong!')
  }
}
