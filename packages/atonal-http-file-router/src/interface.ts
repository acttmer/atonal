import {
  DefaultBody,
  DefaultHeaders,
  DefaultParams,
  DefaultQuery,
  LazyCallbackOr,
  Middleware,
  RequestHandler,
  RouteSchema,
  Static,
} from '@atonal/http'

export interface FileRoute<Schema extends RouteSchema> {
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
