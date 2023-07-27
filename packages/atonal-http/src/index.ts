import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'http'
import './bootstrap'
import { HTTPError } from './http/error'
import type { Middleware } from './middleware'

export * from './http'
export * from './middleware'
export * from './router'

export class Http {
  public readonly server: Server
  public readonly middlewares: Middleware[]
  public readonly handlers: {
    onError: (
      res: ServerResponse<IncomingMessage>,
      error: unknown,
    ) => Promise<void> | void
    onMiddlewareResult: (
      res: ServerResponse<IncomingMessage>,
      result: unknown,
    ) => Promise<void> | void
  }

  constructor() {
    this.server = createServer()
    this.middlewares = []
    this.handlers = {
      onError: (res, error) => {
        if (error instanceof HTTPError) {
          res.statusCode = error.statusCode
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              code: error.statusCode,
              message: error.message,
              data: error.data,
            }),
          )
        } else if (error instanceof Error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              code: 500,
              message: error.message,
            }),
          )
        } else {
          throw error
        }
      },
      onMiddlewareResult: (res, result) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(result))
      },
    }
  }

  use(middleware: Middleware) {
    this.middlewares.push(middleware)
  }

  listen(port: number, hostname: string, cb?: () => void) {
    this.server.on('request', async (req, res) => {
      try {
        for (const middleware of this.middlewares) {
          const result = await middleware(req, res)

          if (result !== undefined) {
            await this.handlers.onMiddlewareResult(res, result)
            break
          }

          if (res.writableEnded) {
            break
          }
        }
      } catch (error) {
        this.handlers.onError(res, error)
      }
    })

    this.server.listen(port, hostname, cb)
  }
}

export const createHttp = () => new Http()
