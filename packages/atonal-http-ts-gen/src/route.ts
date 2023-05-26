import { CompiledRoute } from '@atonal/http'
import { generateSchemaTypes } from './schema'

export const generateRouteCode = (route: CompiledRoute) => {
  const { argsType, returnType } = generateSchemaTypes(route.schema)

  let replaceIndex = 0

  const path = route.path.replace(/:\w+/g, () => {
    return `\${args.params.${route.params[replaceIndex++]}}`
  })

  const { name, method } = route

  const optional = argsType === '{}' ? ' = {}' : ''
  const genericTag = returnType === 'unknown' ? '<T = any>' : ''
  const genericReturn = returnType === 'unknown' ? 'T' : returnType

  return `
      async ${name}${genericTag}(args: ${argsType}${optional}): Promise<${genericReturn}> {
        return this.request${returnType === 'unknown' ? '<T>' : ''}({
          method: '${method}',
          path: \`${path}\`,
          ...args
        })
      }
    `
}
