import { HTTPError, parseRequestBody, type DefaultParams } from '../http'
import { defineMiddleware, type Middleware } from '../middleware'
import type { CompiledRoute, Route, RouteSchema } from './interface'
import { parseRoutePath } from './utils'

export interface RouterInit {
  readonly prefix?: string
  readonly middlewares?: Middleware[]
  readonly routes?: Route<RouteSchema>[]
}

export class Router {
  private readonly prefix: string
  private readonly middlewares: Middleware[]
  private readonly routes: Route<RouteSchema>[]

  constructor({ prefix = '', middlewares = [], routes = [] }: RouterInit = {}) {
    this.prefix = prefix
    this.middlewares = middlewares
    this.routes = routes
  }

  getRoutes() {
    return this.routes
  }

  use(middleware: Middleware): Router
  use(path: string, router: Router): Router
  use(router: Router): Router
  use(source: string | Router | Middleware, router?: Router) {
    if (typeof source === 'string') {
      if (router) {
        for (const { path, ...route } of router.routes) {
          this.route({ path: source + path, ...route })
        }
      }
    } else if (source instanceof Router) {
      for (const route of source.routes) {
        this.route(route)
      }
    } else {
      this.middlewares.push(source)
    }

    return this
  }

  route<Schema extends RouteSchema>({ path, ...route }: Route<Schema>) {
    this.routes.push({
      path: this.prefix + path,
      ...route,
    })

    return this
  }

  compile() {
    const routes = this.routes.map(route => {
      const { name, method, path, schema, middlewares = [], handler } = route
      const { pattern, params } = parseRoutePath(path)

      return {
        name,
        method,
        path,
        pattern,
        params,
        schema: typeof schema === 'function' ? schema() : schema,
        middlewares,
        handler,
      } satisfies CompiledRoute
    })

    return defineMiddleware(async (req, res) => {
      for (const middleware of this.middlewares) {
        const result = await middleware(req, res)

        if (result !== undefined) {
          return result
        }

        if (res.writableEnded) {
          return
        }
      }

      if (req.method === undefined || req.url === undefined) {
        return
      }

      for (const route of routes) {
        if (route.method !== req.method.toUpperCase()) {
          continue
        }

        const { url, headers } = req
        const { pathname, searchParams } = new URL(url, `http://localhost`)

        const match = pathname.match(route.pattern)

        if (match === null) {
          continue
        }

        const params = match.slice(1).reduce((prev, curr, index) => {
          prev[route.params[index]] = curr
          return prev
        }, {} as DefaultParams)

        const query = Object.fromEntries(searchParams)
        const body = await parseRequestBody(req)

        const request = Object.assign(req, {
          params,
          query,
          body,
          headers,
        })

        const { schema, middlewares, handler } = route

        if (schema) {
          if (schema.params) {
            const parsed = await schema.params.safeParseAsync(request.params)

            if (!parsed.success) {
              throw new HTTPError({
                statusCode: 400,
                message: 'Invalid request params',
                data: { issues: parsed.error.issues },
              })
            }

            Object.assign(request.params, parsed.data)
          }

          if (schema.query) {
            const parsed = await schema.query.safeParseAsync(request.query)

            if (!parsed.success) {
              throw new HTTPError({
                statusCode: 400,
                message: 'Invalid request query',
                data: { issues: parsed.error.issues },
              })
            }

            Object.assign(request.query, parsed.data)
          }

          if (schema.body) {
            const parsed = await schema.body.safeParseAsync(request.body)

            if (!parsed.success) {
              throw new HTTPError({
                statusCode: 400,
                message: 'Invalid request body',
                data: { issues: parsed.error.issues },
              })
            }

            if (request.body !== null) {
              Object.assign(request.body, parsed.data)
            }
          }

          if (schema.headers) {
            const parsed = await schema.headers.safeParseAsync(request.headers)

            if (!parsed.success) {
              throw new HTTPError({
                statusCode: 400,
                message: 'Invalid request headers',
                data: { issues: parsed.error.issues },
              })
            }

            Object.assign(request.headers, parsed.data)
          }
        }

        for (const middleware of middlewares) {
          const result = await middleware(req, res)

          if (result !== undefined) {
            return result
          }

          if (res.writableEnded) {
            return
          }
        }

        return handler(request, res)
      }

      throw new HTTPError({
        statusCode: 404,
        message: 'Not found',
      })
    })
  }
}

export const createRouter = (init: RouterInit = {}) => new Router(init)
