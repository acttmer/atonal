import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'http'
import { ParsedUrlQuery } from 'querystring'

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | Readonly<{ [x: string]: JSONValue }>
  | ReadonlyArray<JSONValue>

export type DefaultParams = Record<string, string>
export type DefaultQuery = ParsedUrlQuery
export type DefaultBody = JSONValue
export type DefaultHeaders = IncomingHttpHeaders
export type DefaultResponseData = unknown

export type Request<
  Params = DefaultParams,
  Query = DefaultQuery,
  Body = DefaultBody,
  Headers = DefaultHeaders,
> = IncomingMessage & {
  readonly params: Params
  readonly query: Query
  readonly body: Body
  readonly headers: Headers
}

export type Response = ServerResponse<IncomingMessage>

export type RequestHandler<
  Params = DefaultParams,
  Query = DefaultQuery,
  Body = DefaultBody,
  Headers = DefaultHeaders,
> = (
  req: Request<Params, Query, Body, Headers>,
  res: Response,
) => Promise<unknown> | unknown | Promise<void> | void
