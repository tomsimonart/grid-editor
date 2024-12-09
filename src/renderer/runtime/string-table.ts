export namespace Runtime {
  export enum ErrorText {
    LENGTH_ERROR = `Modifications can not be synced with grid, 
        maximum character limit reached. Shorten your code or delete action blocks.`,
    SYNTAX_ERROR = `Action(s) with syntax error(s) can not be merged!`,
    UNCLOSED_PARENTHESIS = `Action(s) with unclosed parenthesis will not be synced with grid!`,
  }
}

export namespace ProfileCloud {
  export enum ErrorText {
    NO_DEVICE = `No device is connected.`,
  }
}
