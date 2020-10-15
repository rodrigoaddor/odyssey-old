import { PermissionResolvable, TextChannel, User } from 'discord.js'
import { AmongUsData, AmongUsStage, Colors, ColorToEmoji, isColor } from '../data/among_us'
import { Argument, Command, RunnerParameters } from '../data/command'
import { CommandError } from '../data/errors'

export default class AmongUsCommand extends Command {
  name = 'amongus'
  description = 'Control the voice chat during an Among Us match'

  aliases = ['au']
  permissions: PermissionResolvable = 'MANAGE_CHANNELS'

  constructor() {
    super()

    this.addSubcommand(new AmongUsSetCommand())
    this.addSubcommand(new AmongUsVotingCommand())
    this.addSubcommand(new AmongUsPlayingCommand())
  }

  static games: Map<String, AmongUsData> = new Map()

  async run({ message }: RunnerParameters) {
    if (!(message.channel instanceof TextChannel)) {
      message.reply('I must be on a server\'s text channel.')
      return
    }

    if (!AmongUsCommand.games.has(message.channel.id)) {
      AmongUsCommand.games.set(message.channel.id, new AmongUsData(message.author))
    }

    const data = AmongUsCommand.games.get(message.channel.id)!

    const emojis: ColorToEmoji = Object.fromEntries(
      message.guild!.emojis.cache
        .filter(({ name }) => name.startsWith('au') && isColor(name.slice(2)))
        .map((emoji) => [emoji.name.slice(2), emoji])
    )

    const msg = await message.channel.send({ embed: data.buildEmbed(emojis) })
    data.on('update', () => msg.edit({ embed: data.buildEmbed(emojis) }))
    data.on('removeReaction',
      (user: User, color: Colors) => {
        msg.reactions.cache.forEach(reaction => reaction.emoji.name.slice(2) == color && reaction.users.remove(user))
      })

    if (data.stage == AmongUsStage.Lobby) {
      Object.values(emojis).forEach((emoji) => {
        !!emoji && msg.react(emoji)
      })
    }

    const collector = msg.createReactionCollector((_, user: User) => user != message.client.user, { dispose: true })

    collector.on('collect', (reaction, user) => {
      const emojiColor = reaction.emoji.name.slice(2)
      const color: Colors | false = isColor(emojiColor) && emojiColor

      if (data.stage == AmongUsStage.Lobby) {
        if (!color || !data.setColor(user, color)) {
          reaction.users.remove(user)
        }
      }
    })

    collector.on('remove', (reaction, user) => {
      const emojiColor = reaction.emoji.name.slice(2)
      const color: Colors | false = isColor(emojiColor) && emojiColor

      if (data.stage == AmongUsStage.Lobby) {
        if (!!color && data.getColor(user) == color) {
          data.setColor(user)
        }
      }
    })
  }
}

class AmongUsSetCommand extends Command {
  name = 'set'
  description = 'Modifies an user info'

  arguments = [Argument.String, Argument.String]

  async run({ message, args }: RunnerParameters) {
    const [user, option] = args as [User, Colors | 'dead' | 'alive' | 'remove' | undefined] | [Colors, 'dead' | 'alive' | 'remove']
    const color = Colors.find(color => color.toLowerCase() == option?.toLowerCase())
    const game = AmongUsCommand.games.get(message.channel.id)

    if (!color && (!option || !['dead', 'alive', 'remove'].includes(option))) {
      console.log(option)
      throw new CommandError(`Unknown action.`)
    }

    if (!game) {
      throw new CommandError(`There isn't an Among Us game running in this channel.`)
    }

    const player = message.guild!.member(user)

    if (!!player && (!!color || option == 'remove')) {
      const success = game.setColor(player.user, color)
      message.react(success ? '✅' : '❎')
    } else if (typeof user == 'string') {
      const playerID = game.getUser(user)
      if (!!playerID) {
        const player = message.guild?.member(playerID)
        if (!!player) {
          if (!!color) {
            game.setColor(player.user, color)
          } else if (['dead', 'alive'].includes(option ?? '')) {
            game.setAlive(player.user, option == 'dead' ? false : true)
            return
          }
        }
      }
      message.react('❎')
    }
  }
}

class AmongUsVotingCommand extends Command {
  name = 'voting'
  description = 'Unmute everyone who isn\'t dead.'

  async run({ message, send }: RunnerParameters) {
    const data = AmongUsCommand.games.get(message.channel.id)
    if (!data) {
      send(`${message.author}, This channel doesn't have an Among Us game.`)
      return
    }

    if (message.author != data.owner) {
      send(`${message.author}, You are not the owner of this Among Us game.`)
      return
    }

    data.alives.forEach(player => message.guild!.member(player)?.voice.setMute(false))
  }
}

class AmongUsPlayingCommand extends Command {
  name = 'playing'
  description = 'Mute everyone.'

  async run({ message, send }: RunnerParameters) {
    const data = AmongUsCommand.games.get(message.channel.id)
    if (!data) {
      send(`${message.author}, This channel doesn't have an Among Us game.`)
      return
    }

    if (message.author != data.owner) {
      send(`${message.author}, You are not the owner of this Among Us game.`)
      return
    }

    data.alives.forEach(player => message.guild!.member(player)?.voice.setMute(true))
  }
}