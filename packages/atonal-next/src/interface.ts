import type { IncomingHttpHeaders } from 'http'
import type { NextRequest, NextResponse } from 'next/server'
import type { ParsedUrlQuery } from 'querystring'
import type { TypeOf, ZodIssue, ZodType } from 'zod'

export type Static<T, U> = [T] extends [ZodType] ? TypeOf<T> : U

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

export type Request<
  Params = DefaultParams,
  Query = DefaultQuery,
  Body = DefaultBody,
  Headers = DefaultHeaders,
> = NextRequest & {
  readonly params: Params
  readonly query: Query
  readonly body: Body
  readonly headers: Headers
}

export type Middleware = (req: Request) => Promise<void> | void

export type RequestHandler<
  Params = DefaultParams,
  Query = DefaultQuery,
  Body = DefaultBody,
  Headers = DefaultHeaders,
> = (req: Request<Params, Query, Body, Headers>) => unknown | Promise<unknown>

export interface RouteSchema {
  readonly params?: unknown
  readonly query?: unknown
  readonly body?: unknown
  readonly headers?: unknown
}

export interface Route<Schema extends RouteSchema = RouteSchema> {
  readonly middlewares?: readonly Middleware[]
  readonly schema?: Schema
  readonly handler: RequestHandler<
    Static<Schema['params'], DefaultParams>,
    Static<Schema['query'], DefaultQuery>,
    Static<Schema['body'], DefaultBody>,
    Static<Schema['headers'], DefaultHeaders>
  >
}

export type SuccessResponseModifier = (data: unknown) => NextResponse
export type ErrorResponseModifier = (error: unknown) => NextResponse
export type InvalidRequestResponseModifier = (
  errors: ZodIssue[],
) => NextResponse
