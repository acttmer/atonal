import { CompiledRoute } from '@atonal/http'
import { generateRouteCode } from './route'

export const generateClientCode = (routes: CompiledRoute[]) => {
  return `
    export class ClientError extends Error {
      public readonly code: number

      constructor(code: number, message: string) {
        super(message)

        this.code = code
      }
    }

    export type ClientResponseHandler = (json: any) => any

    export const DEFAULT_CLIENT_RESPONSE_HANDLER: ClientResponseHandler =
      (json: any) => {
        if (json.code !== 0) {
          throw new ClientError(json.code, json.message)
        }

        return json.data
      }

    export interface ClientDefaults {
      query: { [key: string]: string }
      headers: { [key: string]: string }
    }

    export class Client {
      public baseURL: string
      public defaults: ClientDefaults
      public responseHandler: ClientResponseHandler

      constructor({
        baseURL,
        defaults = {
          query: {},
          headers: {},
        },
        responseHandler = DEFAULT_CLIENT_RESPONSE_HANDLER
      } : {
        readonly baseURL: string
        readonly defaults?: ClientDefaults
        readonly responseHandler?: ClientResponseHandler
      }) {
        this.baseURL = baseURL
        this.defaults = defaults
        this.responseHandler = responseHandler
      }

      async request<T>({
        method,
        path,
        query,
        body,
        headers,
      }: {
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'
        path: string
        query?: { [key: string]: string | boolean | number }
        body?: any
        headers?: { [key: string]: string }
      }): Promise<T> {
        const searchParams = new URLSearchParams(Object.fromEntries(
          Object.entries({
            ...this.defaults.query,
            ...query
          })
            .filter(([, value]) => typeof value !== 'undefined' )
            .map(([key, value]) => [key, String(value)])
        ))

        const queryString = Array.from(searchParams).length > 0
          ? '?' + searchParams.toString()
          : ''

        const res = await fetch(this.baseURL + path + queryString, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...this.defaults.headers,
            ...headers,
          },
          ...body && { body: JSON.stringify(body) },
        })

        const json = await res.json()

        return this.responseHandler(json) as T
      }

      ${routes.map(generateRouteCode).join('\n')}
    }
  `
}
