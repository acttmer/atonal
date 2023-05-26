import { Server, createServer } from 'http'
import { Router } from './router/router'

export * from './http'
export * from './middleware'
export * from './router'

export class Http {
  public readonly router: Router
  public readonly httpServer: Server

  constructor() {
    this.router = new Router()
    this.httpServer = createServer()
  }

  get modifiers() {
    return this.router.modifiers
  }

  get use() {
    return this.router.use.bind(this.router)
  }

  get route() {
    return this.router.route.bind(this.router)
  }

  get routesDirectory() {
    return this.router.routesDirectory.bind(this.router)
  }

  listen(port: number, hostname: string, cb?: () => void) {
    this.httpServer.on('request', (req, res) => {
      this.router.handle(req, res)
    })

    this.httpServer.listen(port, hostname, cb)
  }
}

export const createHttp = () => new Http()
