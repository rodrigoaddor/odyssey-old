import { ECANCELED } from "constants"
import { GuildEmoji, MessageAttachment, MessageEmbed, User, UserFlags } from "discord.js"
import { EventEmitter } from "events"

export const Colors = ['Red', 'Blue', 'Green', 'Pink', 'Orange', 'Yellow', 'Black', 'White', 'Purple', 'Brown', 'Cyan', 'Lime', 'Tan'] as const
export type Colors = typeof Colors[number]
export type ColorToEmoji = { [Color in Colors]?: GuildEmoji }
export const isColor = (color: string): color is Colors => Colors.some(sColor => sColor == color)

export enum AmongUsStage {
  Lobby, Playing, Voting
}

const stageDescription: { [Stage in AmongUsStage]: string } = {
  [AmongUsStage.Lobby]: 'in lobby',
  [AmongUsStage.Playing]: 'in game',
  [AmongUsStage.Voting]: 'voting'
}

export class AmongUsData extends EventEmitter {
  code?: string
  stage: AmongUsStage = AmongUsStage.Lobby
  #alive: Map<string, boolean> = new Map()
  #players: Map<string, Colors> = new Map()
  owner: User

  constructor(owner: User) {
    super()
    this.owner = owner
  }

  get description(): string { return `Currently ${stageDescription[this.stage]}` }

  setColor = (user: User, color?: Colors): boolean => {
    if (!color && this.#players.has(user.id)) {
      this.emit('removeReaction', user, this.#players.get(user.id))
      this.#players.delete(user.id)
      this.#alive.delete(user.id)
    } else if (!!color && this.isColorAvailable(color)) {
      if (this.#players.has(user.id)) {
        this.emit('removeReaction', user, this.#players.get(user.id))
        this.#players.delete(user.id)
      }
      this.#players.set(user.id, color)
      this.#alive.set(user.id, true)
    }

    this.emit('update')
    return this.#players.get(user.id) == color
  }

  getColor = (user: User): Colors | undefined => {
    return this.#players.get(user.id)
  }

  isColorAvailable = (color: Colors, user?: User): boolean => ![...this.#players.values()].includes(color) || (!!user && this.#players.get(user.id) == color)

  get players(): string[] {
    return [...this.#players.keys()]
  }

  get alives(): string[] {
    return this.players.filter(player => this.#alive.get(player))
  }

  get deads(): string[] {
    return this.players.filter(player => !this.#alive.get(player))
  }

  getUser = (color: Colors): string | undefined => {
    return [...this.#players.entries()].find(entry => entry[1].toLowerCase().includes(color.toLowerCase()))?.[0]
  }

  isAlive = (user: User): boolean => this.#alive.get(user.id) ?? false

  setAlive = (user: User, alive: boolean) => {
    this.#alive.set(user.id, alive)
    this.emit('update')
  }

  buildEmbed = (colorEmojis: ColorToEmoji): MessageEmbed => {
    const lobbyImage = new MessageAttachment('./assets/lobby.png', 'lobby.png')

    const embed = new MessageEmbed()
      .setTitle('Among Us')
      .setDescription(this.description)
      .attachFiles([lobbyImage])
      .setThumbnail('attachment://lobby.png')

    if (!!this.code)
      embed.addField('Room Code', this.code)

    if (this.stage == AmongUsStage.Lobby && this.#players.size > 0) {
      embed.addField('Players', [...this.#players.entries()].map(entry => `${colorEmojis[entry[1]]} - <@${entry[0]}>`).join('\n'))
    }

    if (this.stage == AmongUsStage.Playing) {
      embed.addField('Alive', [...this.#alive.entries()].filter(entry => entry[1]).map(([player]) => colorEmojis[this.#players.get(player)!]))
    }

    return embed
  }

  startGame = () => {
    this.stage = AmongUsStage.Playing
    this.emit('update')
  }

  dispose = () => {
    this.removeAllListeners()
  }
} 