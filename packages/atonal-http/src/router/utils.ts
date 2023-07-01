export const parseRoutePath = (path: string) => {
  const params: string[] = []
  const pattern = new RegExp(
    `^${path.replace(/:\w+/g, param => {
      params.push(param.slice(1))
      return '([^/]+)'
    })}$`,
  )

  return { params, pattern }
}
