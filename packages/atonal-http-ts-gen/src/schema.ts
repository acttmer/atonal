import { RouteSchema } from '@atonal/http'
import { ZodType } from 'zod'
import { printNode, zodToTs } from 'zod-to-ts'

export const generateSchemaTypes = (schema: RouteSchema | undefined) => {
  let argsType = '{'

  if (schema?.params instanceof ZodType) {
    const paramsType = printNode(zodToTs(schema.params).node)

    argsType += `params: ${paramsType}\n`
  }

  if (schema?.query instanceof ZodType) {
    const queryType = printNode(zodToTs(schema.query).node)

    argsType += `query: ${queryType}\n`
  }

  if (schema?.body instanceof ZodType) {
    const bodyType = printNode(zodToTs(schema.body).node)

    argsType += `body: ${bodyType}\n`
  }

  if (schema?.headers instanceof ZodType) {
    const headersType = printNode(zodToTs(schema.headers).node)

    argsType += `headers: ${headersType}\n`
  }

  argsType += '}'

  let returnType = 'unknown'

  if (schema?.responseData instanceof ZodType) {
    returnType = printNode(zodToTs(schema.responseData).node)
  }

  return { argsType, returnType }
}
