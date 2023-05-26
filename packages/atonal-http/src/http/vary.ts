import { ServerResponse as Response } from 'http'

const FIELD_NAME_REGEXP = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/

const parse = (header: string) => {
  let end = 0
  let list = []
  let start = 0

  for (var i = 0, len = header.length; i < len; i++) {
    switch (header.charCodeAt(i)) {
      case 0x20:
        if (start === end) {
          start = end = i + 1
        }
        break
      case 0x2c:
        list.push(header.substring(start, end))
        start = end = i + 1
        break
      default:
        end = i + 1
        break
    }
  }

  list.push(header.substring(start, end))

  return list
}

export const append = (header: string, field: string | string[]) => {
  const fields = !Array.isArray(field) ? parse(String(field)) : field

  for (const field of fields) {
    if (!FIELD_NAME_REGEXP.test(field))
      throw new TypeError('field argument contains an invalid header name')
  }

  if (header === '*') {
    return header
  }

  let val = header

  const vals = parse(header.toLowerCase())

  if (fields.indexOf('*') !== -1 || vals.indexOf('*') !== -1) {
    return '*'
  }

  for (const field of fields) {
    const fld = field.toLowerCase()

    if (vals.indexOf(fld) === -1) {
      vals.push(fld)
      val = val ? val + ', ' + field : field
    }
  }

  return val
}

export const vary = (res: Response, field: string | string[]) => {
  let val = res.getHeader('Vary') || ''

  const header = Array.isArray(val) ? val.join(', ') : String(val)

  if ((val = append(header, field))) {
    res.setHeader('Vary', val)
  }
}
