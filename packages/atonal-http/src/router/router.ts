import type { IncomingMessage, ServerResponse } from 'http'
import { parse as parseQuerystring } from 'querystring'
import { parse as parseUrl } from 'url'
import { ZodType } from 'zod'
import { DefaultParams, RequestHandler, parseRequestBody } from '../http'
import type { Middleware } from '../middleware'
import { addRoutesFromDirectory } from './directory'
import type {
  CompiledRoute,
  ErrorResponseModifier,
  InvalidRequestResponseModifier,
  NotFoundResponseModifier,
  Route,
  RouteSchema,
  SuccessResponseModifier,
} from './interface'
import {
  DEFAULT_ERROR_RESPONSE_MODIFIER,
  DEFAULT_INVALID_REQUEST_RESPONSE_MODIFIER,
  DEFAULT_NOT_FOUND_RESPONSE_MODIFIER,
  DEFAULT_SUCCESS_RESPONSE_MODIFIER,
} from './utils'

export class Router {
  public readonly modifiers: {
    success: SuccessResponseModifier
    error: ErrorResponseModifier
    invalidRequest: InvalidRequestResponseModifier
    notFound: NotFoundResponseModifier
  }

  private readonly routes: CompiledRoute[]
  private readonly middlewares: Middleware[]

  constructor() {
    this.modifiers = {
      success: DEFAULT_SUCCESS_RESPONSE_MODIFIER,
      error: DEFAULT_ERROR_RESPONSE_MODIFIER,
      invalidRequest: DEFAULT_INVALID_REQUEST_RESPONSE_MODIFIER,
      notFound: DEFAULT_NOT_FOUND_RESPONSE_MODIFIER,
    }

    this.routes = []
    this.middlewares = []
  }

  getRoutes() {
    return this.routes
  }

  use(middleware: Middleware) {
    this.middlewares.push(middleware)
  }

  route<Schema extends RouteSchema>({
    name,
    method,
    path,
    schema,
    middlewares,
    handler,
  }: Route<Schema>) {
    const params: string[] = []
    const regexString = path.replace(/:\w+/g, param => {
      params.push(param.slice(1))
      return '([^/]+)'
    })

    this.routes.push({
      name,
      method,
      path,
      pattern: new RegExp(`^${regexString}$`),
      params,
      schema: typeof schema === 'function' ? schema() : schema,
      middlewares,
      handler: handler as RequestHandler,
    })

    return this
  }

  async routesDirectory(baseDir: string, prefix: string = '/') {
    await addRoutesFromDirectory(this, baseDir, prefix)
    return this
  }

  async handle(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
    try {
      for (const middleware of this.middlewares) {
        await middleware(req, res)

        if (res.writableEnded) {
          return
        }
      }
    } catch (error) {
      return this.modifiers.error(req, res, error)
    }

    if (typeof req.method === 'undefined' || typeof req.url === 'undefined') {
      return
    }

    const { pathname, query } = parseUrl(req.url)

    if (pathname === null) {
      return
    }

    let matched = false

    for (const route of this.routes) {
      if (route.method !== req.method.toUpperCase()) {
        continue
      }

      const match = pathname.match(route.pattern)

      if (match === null) {
        continue
      }

      matched = true

      const parseBodyResult = await parseRequestBody(req)

      if (!parseBodyResult.success) {
        return this.modifiers.error(req, res, parseBodyResult.error)
      }

      const request = Object.assign(req, {
        params: match.slice(1).reduce((prev, curr, index) => {
          prev[route.params[index]] = curr
          return prev
        }, {} as DefaultParams),
        query: query ? parseQuerystring(query) : {},
        body: parseBodyResult.body,
        headers: req.headers,
      })

      try {
        const { schema, middlewares = [], handler } = route

        if (schema) {
          if (schema.params instanceof ZodType) {
            const parsed = await schema.params.safeParseAsync(request.params)

            if (!parsed.success) {
              return this.modifiers.invalidRequest(
                req,
                res,
                parsed.error.errors,
              )
            }

            Object.assign(request.params, parsed.data)
          }

          if (schema.query instanceof ZodType) {
            const parsed = await schema.query.safeParseAsync(request.query)

            if (!parsed.success) {
              return this.modifiers.invalidRequest(
                req,
                res,
                parsed.error.errors,
              )
            }

            Object.assign(request.query, parsed.data)
          }

          if (schema.body instanceof ZodType) {
            const parsed = await schema.body.safeParseAsync(request.body)

            if (!parsed.success) {
              return this.modifiers.invalidRequest(
                req,
                res,
                parsed.error.errors,
              )
            }

            if (request.body !== null) {
              Object.assign(request.body, parsed.data)
            }
          }

          if (schema.headers instanceof ZodType) {
            const parsed = await schema.headers.safeParseAsync(request.headers)

            if (!parsed.success) {
              return this.modifiers.invalidRequest(
                req,
                res,
                parsed.error.errors,
              )
            }

            Object.assign(request.headers, parsed.data)
          }
        }

        for (const middleware of middlewares) {
          await middleware(req, res)

          if (res.writableEnded) {
            return
          }
        }

        const json = await handler(request, res)

        if (json) {
          return this.modifiers.success(req, res, json)
        }
      } catch (error) {
        return this.modifiers.error(req, res, error)
      }
    }

    if (!matched) {
      return this.modifiers.notFound(req, res)
    }
  }
}
