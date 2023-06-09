export const SUPPORT_HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
] as const

export const resolveUrlPaths = (...paths: string[]) => {
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
