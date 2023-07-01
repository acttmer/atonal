import { createRouter, type RouteSchema } from '@atonal/http'
import fs from 'fs/promises'
import path from 'path'
import type { FileRoute } from './interface'
import { resolveUrlPaths, SUPPORT_HTTP_METHODS } from './utils'

export const defineRoute = <Schema extends RouteSchema>(
  route: FileRoute<Schema>,
) => route

export const createFileRouter = async ({
  baseDir,
  prefix = '/',
}: {
  baseDir: string
  prefix?: string
}) => {
  const router = createRouter()

  const walk = async (dirname: string, prefix: string) => {
    const filenames = await fs.readdir(dirname)

    for (const filename of filenames) {
      if (filename.endsWith('.d.ts') || filename.endsWith('.map')) {
        continue
      }

      const filepath = path.resolve(dirname, filename)
      const stat = await fs.stat(filepath)

      const pathname = resolveUrlPaths(
        prefix,
        filename
          .replace(/^\[(\w+)\]/g, ':$1')
          .replace(/(\.js|\.ts)$/, '')
          .replace(/^index$/, '/'),
      )

      if (stat.isDirectory()) {
        await walk(filepath, pathname)
      } else {
        const module = require(filepath)

        for (const method of SUPPORT_HTTP_METHODS) {
          if (module[method]) {
            router.route({
              name: module[method].name,
              method,
              path: pathname,
              middlewares: module[method].middlewares,
              schema: module[method].schema,
              handler: module[method].handler,
            })
          }
        }
      }
    }
  }

  await walk(baseDir, prefix)

  return router
}
