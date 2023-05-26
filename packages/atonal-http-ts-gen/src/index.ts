import { Http } from '@atonal/http'
import { writeFile } from 'fs/promises'
import { Options as PrettierOptions, format } from 'prettier'
import { generateClientCode } from './client'

export * from './client'
export * from './route'
export * from './schema'

export const generateClientFromHttp = async (
  http: Http,
  {
    outputPath,
    prettierOptions = {
      singleQuote: true,
      trailingComma: 'all',
      semi: false,
      arrowParens: 'avoid',
      parser: 'typescript',
    },
  }: {
    readonly outputPath: string
    readonly prettierOptions?: PrettierOptions
  },
) => {
  const routes = http.router.getRoutes()
  const clientCode = generateClientCode(routes)
  const output = format(clientCode, prettierOptions)

  await writeFile(outputPath, output, 'utf-8')
}
