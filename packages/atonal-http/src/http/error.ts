export class HTTPError extends Error {
  public readonly statusCode: number
  public readonly data?: unknown

  constructor({
    statusCode,
    message,
    data,
  }: {
    readonly statusCode: number
    readonly message?: string
    readonly data?: unknown
  }) {
    super(message)

    this.statusCode = statusCode
    this.data = data
  }
}
