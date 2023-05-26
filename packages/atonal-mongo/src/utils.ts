export const isReadonlyArray = (arg: any): arg is ReadonlyArray<any> => {
  return Array.isArray(arg)
}

export const omitUndefinedObjectValues = <T extends Record<any, any>>(
  record: T,
) => {
  const cloned = { ...record }

  for (const key of Object.keys(cloned)) {
    if (cloned[key] === undefined) {
      delete cloned[key]
    }
  }

  return cloned as Required<T>
}

const traversalGetHelper = (
  obj: { [key: string]: any },
  paths: string[],
): any => {
  if (typeof obj === 'undefined' || obj === null || paths.length === 0) {
    return obj
  }

  const current = obj[paths.shift() as string]

  if (Array.isArray(current)) {
    return current
      .map(item => traversalGetHelper(item, [...paths]))
      .filter(item => typeof item !== 'undefined' && item !== null)
  }

  return traversalGetHelper(current, paths)
}

export const traversalGet = <T>(obj: { [key: string]: any }, path: string): T =>
  traversalGetHelper(obj, path.split('.'))

export const arrayToMap = <T extends { [key: string]: any }>(
  arr: T[],
  key: keyof T,
) =>
  arr.reduce(
    (mapRef, item) => mapRef.set(String(item[key]), item),
    new Map<string, T>(),
  )

const traversalReplaceHelper = (
  data: { [key: string]: any },
  sourceMap: Map<string, any>,
  path: string[],
): any => {
  if (path.length === 1) {
    const current = data[path[0]]

    if (typeof current !== 'undefined' && current !== null) {
      if (Array.isArray(current)) {
        data[path[0]] = current.map(item => sourceMap.get(String(item)))
      } else {
        data[path[0]] = sourceMap.get(String(current))
      }
    }
  } else if (path.length > 0) {
    const current = data[path.shift() as string]

    if (typeof current !== 'undefined' && current !== null) {
      if (Array.isArray(current)) {
        for (const item of current) {
          traversalReplaceHelper(item, sourceMap, [...path])
        }
      } else {
        traversalReplaceHelper(current, sourceMap, path)
      }
    }
  }
}

export const traversalReplace = <T>(
  data: { [key: string]: any },
  sourceMap: Map<string, any>,
  path: string,
): T => traversalReplaceHelper(data, sourceMap, path.split('.'))
