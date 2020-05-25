interface ICommandError {
  message?: string
}

export class CommandError extends Error {
  constructor(message?: string) {
    super(message ?? 'Invalid usage.')
  }
}
