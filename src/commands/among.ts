import { Argument, Command } from "../data/command"

export default <Command>{
  name: 'among',
  subCommands: {
    mute: {
      arguments: [Argument.String],
      permission: 'MANAGE_GUILD',
      run: async ({ message: msg, send }) => {
        msg.member?.voice.channel?.members.forEach((member) => member.voice.setMute(true))
        msg.react('👍')
      },
    },
    unmute: {
      arguments: [Argument.String],
      permission: 'MANAGE_GUILD',
      run: async ({ message: msg, send }) => {
        msg.member?.voice.channel?.members.forEach((member) => member.voice.setMute(false))
        msg.react('👍')
      },
    }
  },
}
