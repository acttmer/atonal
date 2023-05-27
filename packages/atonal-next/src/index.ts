import type { NextRequest } from 'next/server'
import { parse as parseQuerystring } from 'querystring'
import { parse as parseUrl } from 'url'
import { ZodType } from 'zod'
import type {
  DefaultParams,
  Middleware,
  Request,
  Route,
  RouteSchema,
} from './interface'
import {
  DEFAULT_ERROR_RESPONSE_MODIFIER,
  DEFAULT_INVALID_REQUEST_RESPONSE_MODIFIER,
  DEFAULT_SUCCESS_RESPONSE_MODIFIER,
} from './utils'

export * from './interface'
export * from './utils'

export const createNext = () => {
  const modifiers = {
    success: DEFAULT_SUCCESS_RESPONSE_MODIFIER,
    error: DEFAULT_ERROR_RESPONSE_MODIFIER,
    invalidRequest: DEFAULT_INVALID_REQUEST_RESPONSE_MODIFIER,
  }

  const defineRoute = <Schema extends RouteSchema>({
    schema,
    middlewares = [],
    handler,
  }: Route<Schema>) => {
    return async (
      nextRequest: NextRequest,
      {
        params,
      }: {
        params: DefaultParams
      },
    ) => {
      const { query } = parseUrl(nextRequest.url)

      const req = Object.assign(nextRequest, {
        values: {
          params,
          query: query ? parseQuerystring(query) : {},
          body: nextRequest.body,
          headers: Object.fromEntries(nextRequest.headers),
        },
      }) as Request

      try {
        if (schema) {
          if (schema.params instanceof ZodType) {
            const parsed = await schema.params.safeParseAsync(req.values.params)

            if (parsed.success) {
              Object.assign(req.values.params, parsed.data)
            } else {
              const { errors } = parsed.error

              return modifiers.invalidRequest(errors)
            }
          }

          if (schema.query instanceof ZodType) {
            const parsed = await schema.query.safeParseAsync(req.values.query)

            if (parsed.success) {
              Object.assign(req.values.query, parsed.data)
            } else {
              const { errors } = parsed.error

              return modifiers.invalidRequest(errors)
            }
          }

          if (schema.body instanceof ZodType) {
            const parsed = await schema.body.safeParseAsync(req.values.body)

            if (parsed.success) {
              Object.assign(req.values, { body: parsed.data })
            } else {
              const { errors } = parsed.error

              return modifiers.invalidRequest(errors)
            }
          }

          if (schema.headers instanceof ZodType) {
            const parsed = await schema.headers.safeParseAsync(
              req.values.headers,
            )

            if (parsed.success) {
              Object.assign(req.values.headers, parsed.data)
            } else {
              const { errors } = parsed.error

              return modifiers.invalidRequest(errors)
            }
          }
        }

        for (const middleware of middlewares) {
          await middleware(req)
        }

        const result = await handler(req)

        return modifiers.success(result)
      } catch (error) {
        return modifiers.error(error)
      }
    }
  }

  const defineMiddleware = (cb: Middleware) => cb
  const defineDecorator = (cb: <T>(req: Request) => Promise<T> | T) => cb

  return {
    modifiers,
    defineRoute,
    defineMiddleware,
    defineDecorator,
  }
}
