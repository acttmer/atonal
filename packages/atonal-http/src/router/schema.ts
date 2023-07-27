import {
  z as zod,
  type Primitive,
  type ZodLiteral,
  type ZodNever,
  type ZodTypeAny,
  type ZodUnion,
} from 'zod'

type MappedZodLiterals<T extends readonly Primitive[]> = {
  -readonly [K in keyof T]: ZodLiteral<T[K]>
}

const createManyUnion = <
  A extends Readonly<[Primitive, Primitive, ...Primitive[]]>,
>(
  literals: A,
) => {
  return z.union(
    literals.map(value => z.literal(value)) as MappedZodLiterals<A>,
  )
}

function createUnionSchema<T extends readonly []>(values: T): ZodNever
function createUnionSchema<T extends readonly [Primitive]>(
  values: T,
): ZodLiteral<T[0]>
function createUnionSchema<
  T extends readonly [Primitive, Primitive, ...Primitive[]],
>(values: T): ZodUnion<MappedZodLiterals<T>>
function createUnionSchema<T extends readonly Primitive[]>(values: T) {
  if (values.length > 1) {
    return createManyUnion(
      values as typeof values & [Primitive, Primitive, ...Primitive[]],
    )
  } else if (values.length === 1) {
    return z.literal(values[0])
  } else if (values.length === 0) {
    return z.never()
  }

  throw new Error('Array must have a length')
}

const createArrayFromStringSchema = <T extends ZodTypeAny>(schema: T) => {
  return z.preprocess(obj => {
    if (Array.isArray(obj)) {
      return obj
    } else if (typeof obj === 'string') {
      return obj.split(',')
    } else {
      return []
    }
  }, z.array(schema))
}

export const z = Object.assign(zod, {
  literals: createUnionSchema,
  arrayFromString: createArrayFromStringSchema,
})
