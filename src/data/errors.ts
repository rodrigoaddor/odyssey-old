export enum CommandErrorType {
  InvalidUsage = `Invalid Usage`,
  NoPermissions = `You don't have permission to do that`,
}

interface ICommandError {
  type?: CommandErrorType
  message?: string
}

export class CommandError extends Error {
  readonly type: CommandErrorType

  constructor(parameters?: ICommandError) {
    super(parameters?.message)
    this.type = parameters?.type ?? CommandErrorType.InvalidUsage

    Object.setPrototypeOf(this, CommandError.prototype)
  }
}
