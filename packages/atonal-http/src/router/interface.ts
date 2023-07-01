import type { TypeOf, ZodType } from 'zod'
import type {
  DefaultBody,
  DefaultHeaders,
  DefaultParams,
  DefaultQuery,
  HTTPMethod,
  RequestHandler,
} from '../http'
import type { Middleware } from '../middleware'

export type LazyCallback<T> = () => T
export type LazyCallbackOr<T> = LazyCallback<T> | T

export type Static<T, U> = [T] extends [ZodType] ? TypeOf<T> : U

export interface RouteSchema {
  readonly params?: ZodType
  readonly query?: ZodType
  readonly body?: ZodType
  readonly headers?: ZodType
}

export interface Route<Schema extends RouteSchema> {
  readonly name?: string
  readonly method: HTTPMethod
  readonly path: string
  readonly schema?: LazyCallbackOr<Schema>
  readonly middlewares?: readonly Middleware[]
  readonly handler: RequestHandler<
    Static<Schema['params'], DefaultParams>,
    Static<Schema['query'], DefaultQuery>,
    Static<Schema['body'], DefaultBody>,
    Static<Schema['headers'], DefaultHeaders>
  >
}

export interface CompiledRoute {
  readonly name?: string
  readonly method: HTTPMethod
  readonly path: string
  readonly pattern: RegExp
  readonly params: readonly string[]
  readonly schema?: RouteSchema
  readonly middlewares: readonly Middleware[]
  readonly handler: RequestHandler
}
