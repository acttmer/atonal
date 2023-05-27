import type { IncomingMessage } from 'http'
import type { JSONValue } from './interface'

export type ParseRequestBodyResult =
  | {
      readonly success: true
      readonly body: JSONValue
    }
  | {
      readonly success: false
      readonly error: unknown
    }

export const parseRequestBody = async (req: IncomingMessage) => {
  return new Promise<ParseRequestBodyResult>(resolve => {
    let payload = ''

    req.on('data', chunk => {
      payload += chunk
    })

    req.on('end', () => {
      if (payload.length > 0) {
        try {
          resolve({
            success: true,
            body: JSON.parse(payload),
          })
        } catch (error) {
          resolve({
            success: false,
            error,
          })
        }
      } else {
        resolve({
          success: true,
          body: null,
        })
      }
    })

    req.on('error', error => {
      resolve({
        success: false,
        error,
      })
    })
  })
}
