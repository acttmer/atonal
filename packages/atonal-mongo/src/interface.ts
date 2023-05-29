import {
  CreateIndexesOptions,
  IndexDirection,
  NestedPaths,
  ObjectId,
  OptionalId,
  WithoutId,
} from 'mongodb'

export interface BaseModel {
  readonly _id: ObjectId
}

export interface TimestampsModel {
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type JoinNestedPaths<T extends unknown[]> = T extends []
  ? ''
  : T extends [string | number]
  ? `${T[0]}`
  : T extends [string, ...infer R]
  ? `${T[0]}.${JoinNestedPaths<R>}`
  : T extends [number, ...infer R]
  ? JoinNestedPaths<R>
  : string

export type ModelFields<T> =
  | Exclude<keyof T, number | symbol>
  | JoinNestedPaths<NestedPaths<T, number[]>>

export type IndexFields<Model extends BaseModel> = {
  [field in ModelFields<WithoutId<Model>>]?: IndexDirection
}

export type Index<Model extends BaseModel> =
  | [IndexFields<Model>, CreateIndexesOptions]
  | [IndexFields<Model>]
  | IndexFields<Model>

export type Ref<Model extends BaseModel> = Model | ObjectId

export type PopulateRef<T extends BaseModel> = {
  [K in keyof T]: [T[K]] extends [unknown]
    ? T[K]
    : [T[K]] extends [Ref<infer _X>] | undefined
    ? _X
    : T[K] extends Ref<infer _X>[] | undefined
    ? readonly _X[]
    : T[K]
}

export type DepopulateRef<T extends BaseModel> = {
  [K in keyof T]: [T[K]] extends [unknown]
    ? T[K]
    : [T[K]] extends [Ref<infer _X>] | undefined
    ? ObjectId
    : T[K] extends Ref<infer _X>[] | undefined
    ? readonly ObjectId[]
    : T[K]
}

export type FillableDocument<T extends DepopulateRef<BaseModel>> = Omit<
  OptionalId<T>,
  keyof TimestampsModel
> &
  Partial<TimestampsModel>

export type ToJSON<T> = {
  [K in keyof T]: T[K] extends Date | undefined
    ? string
    : [T[K]] extends [ObjectId | undefined]
    ? string
    : [T[K]] extends [Ref<infer _X> | undefined]
    ? string | ToJSON<_X>
    : [T[K]] extends [{} | undefined]
    ? ToJSON<T[K]>
    : T[K]
}
