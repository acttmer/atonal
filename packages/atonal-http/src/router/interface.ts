import { IncomingMessage, ServerResponse } from 'http'
import { TypeOf, ZodIssue, ZodType } from 'zod'
import {
  DefaultBody,
  DefaultHeaders,
  DefaultParams,
  DefaultQuery,
  RequestHandler,
} from '../http'
import { Middleware } from '../middleware'

type LazyCallback<T> = () => T
type LazyCallbackOr<T> = LazyCallback<T> | T

type Static<T, U> = [T] extends [ZodType] ? TypeOf<T> : U

export type HTTPMethods =
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'PATCH'
  | 'POST'
  | 'PUT'
  | 'OPTIONS'
  | 'PROPFIND'
  | 'PROPPATCH'
  | 'MKCOL'
  | 'COPY'
  | 'MOVE'
  | 'LOCK'
  | 'UNLOCK'
  | 'TRACE'
  | 'SEARCH'

export interface RouteSchema {
  readonly params?: unknown
  readonly query?: unknown
  readonly body?: unknown
  readonly headers?: unknown
  readonly responseData?: unknown
}

export interface Route<Schema extends RouteSchema> {
  readonly name?: string
  readonly method: HTTPMethods
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

export interface MethodRoute<Schema extends RouteSchema> {
  readonly name?: string
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
  readonly method: HTTPMethods
  readonly path: string
  readonly pattern: RegExp
  readonly params: readonly string[]
  readonly schema?: RouteSchema
  readonly middlewares?: readonly Middleware[]
  readonly handler: RequestHandler
}

export type SuccessResponseModifier = (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  data: unknown,
) => Promise<void> | void

export type ErrorResponseModifier = (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  error: unknown,
) => Promise<void> | void

export type InvalidBodyResponseModifier = (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
) => Promise<void> | void

export type InvalidRequestResponseModifier = (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  errors: ZodIssue[],
) => Promise<void> | void

export type NotFoundResponseModifier = (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
) => Promise<void> | void
