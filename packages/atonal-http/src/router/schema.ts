import {
  z as zod,
  type Primitive,
  type RawCreateParams,
  type ZodLiteral,
  type ZodNever,
  type ZodTypeAny,
  type ZodUnion,
} from 'zod'

declare global {
  interface ArrayConstructor {
    isArray(arg: ReadonlyArray<any> | any): arg is ReadonlyArray<any>
  }
}

type MappedZodLiterals<T extends readonly Primitive[]> = {
  -readonly [K in keyof T]: ZodLiteral<T[K]>
}

const createManyUnion = <
  A extends Readonly<[Primitive, Primitive, ...Primitive[]]>,
>(
  literals: A,
) => {
  return zod.union(
    literals.map(value => z.literal(value)) as MappedZodLiterals<A>,
  )
}

function createUnionSchema<const T extends Primitive>(values: T): ZodLiteral<T>
function createUnionSchema<const T extends readonly []>(values: T): ZodNever
function createUnionSchema<const T extends readonly [Primitive]>(
  values: T,
): ZodLiteral<T[0]>
function createUnionSchema<
  const T extends readonly [Primitive, Primitive, ...Primitive[]],
>(values: T): ZodUnion<MappedZodLiterals<T>>
function createUnionSchema<const T extends readonly Primitive[] | Primitive>(
  values: T,
) {
  if (!Array.isArray(values)) {
    return zod.literal(values)
  }

  if (values.length > 1) {
    return createManyUnion(
      values as typeof values & [Primitive, Primitive, ...Primitive[]],
    )
  } else if (values.length === 1) {
    return zod.literal(values[0])
  } else if (values.length === 0) {
    return zod.never()
  }

  throw new Error('Array must have a length')
}

const createArraySchema = <const T extends ZodTypeAny>(
  schema: T,
  params: RawCreateParams & { coerce?: boolean } = {},
) => {
  return zod.preprocess(obj => {
    if (Array.isArray(obj)) {
      return obj
    } else if (params.coerce && typeof obj === 'string') {
      return obj.split(',')
    } else {
      return []
    }
  }, zod.array(schema, params))
}

export const z = {
  ...zod,
  literal: createUnionSchema,
  array: createArraySchema,
}
