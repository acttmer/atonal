import type { IncomingMessage } from 'http'
import type { JSONValue } from './interface'

export const parseRequestBody = async (req: IncomingMessage) => {
  return new Promise<JSONValue>(resolve => {
    let payload = ''

    req.on('data', chunk => {
      payload += chunk
    })

    req.on('end', () => {
      if (payload.length > 0) {
        try {
          resolve(JSON.parse(payload))
        } catch {
          resolve(null)
        }
      } else {
        resolve(null)
      }
    })

    req.on('error', () => resolve(null))
  })
}
