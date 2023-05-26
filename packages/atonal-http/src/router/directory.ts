import fs from 'fs/promises'
import path from 'path'
import { Router } from './router'

const SUPPORT_HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
] as const

const resolveUrlPaths = (...paths: string[]) => {
  const result: string[] = []

  while (paths.length > 0) {
    const path = paths
      .shift()!
      .replace(/^[\/]+/, '')
      .replace(/[\/]+$/, '')

    if (path.length > 0) {
      result.push(path)
    }
  }

  return '/' + result.join('/')
}

export const addRoutesFromDirectory = async (
  router: Router,
  baseDir: string,
  prefix: string = '/',
) => {
  const walk = async (dirname: string, prefix = '/') => {
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
}
