import { IncomingMessage, ServerResponse } from 'http'
import querystring from 'querystring'
import url from 'url'
import { ZodType } from 'zod'
import {
  DefaultParams,
  Request,
  RequestHandler,
  parseRequestBody,
} from '../http'
import { Middleware } from '../middleware'
import { addRoutesFromDirectory } from './directory'
import {
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

    const { pathname, query } = url.parse(req.url)

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

      const params = match.slice(1).reduce((prev, curr, index) => {
        prev[route.params[index]] = curr
        return prev
      }, {} as DefaultParams)

      const parseBodyResult = await parseRequestBody(req)

      if (!parseBodyResult.success) {
        return this.modifiers.error(req, res, parseBodyResult.error)
      }

      const values: Pick<Request, 'params' | 'query' | 'body' | 'headers'> = {
        params,
        query: query ? querystring.parse(query) : {},
        body: parseBodyResult.body,
        headers: req.headers,
      }

      try {
        if (route.schema) {
          if (route.schema.params instanceof ZodType) {
            const response = route.schema.params.safeParse(values.params)

            if (!response.success) {
              return this.modifiers.invalidRequest(
                req,
                res,
                response.error.errors,
              )
            }

            Object.assign(values.params, response.data)
          }

          if (route.schema.query instanceof ZodType) {
            const response = route.schema.query.safeParse(values.query)

            if (!response.success) {
              return this.modifiers.invalidRequest(
                req,
                res,
                response.error.errors,
              )
            }

            Object.assign(values.query, response.data)
          }

          if (route.schema.body instanceof ZodType) {
            const response = route.schema.body.safeParse(values.body)

            if (!response.success) {
              return this.modifiers.invalidRequest(
                req,
                res,
                response.error.errors,
              )
            }

            if (values.body !== null) {
              Object.assign(values.body, response.data)
            }
          }

          if (route.schema.headers instanceof ZodType) {
            const response = route.schema.headers.safeParse(values.headers)

            if (!response.success) {
              return this.modifiers.invalidRequest(
                req,
                res,
                response.error.errors,
              )
            }

            Object.assign(values.headers, response.data)
          }
        }

        const request = Object.assign(req, values)

        if (route.middlewares) {
          for (const middleware of route.middlewares) {
            await middleware(req, res)

            if (res.writableEnded) {
              return
            }
          }
        }

        const json = await route.handler(request, res)

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
