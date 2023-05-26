import { ObjectId } from 'mongodb'
import { BaseModel, Ref } from './interface'
import { PopulateField } from './model'

export const definePopulateField = <
  Model extends BaseModel,
  RefModel extends BaseModel,
>(
  item: PopulateField<Model, RefModel>,
) => item

function asObjectId<T extends BaseModel>(ref: Ref<T>): ObjectId
function asObjectId<T extends BaseModel>(ref?: Ref<T>): ObjectId | undefined
function asObjectId<T extends BaseModel>(ref?: Ref<T>) {
  if (typeof ref === 'undefined' || ref === null) {
    return undefined
  }

  if (ref instanceof ObjectId) {
    return ref
  }

  return ref._id
}

function asDoc<T extends BaseModel>(ref: Ref<T>): T
function asDoc<T extends BaseModel>(ref?: Ref<T>): T | undefined
function asDoc<T extends BaseModel>(ref?: Ref<T>) {
  if (typeof ref === 'undefined' || ref === null) {
    return undefined
  }

  if (ref instanceof ObjectId) {
    return { _id: ref } as T
  }

  return ref
}

export { asObjectId, asDoc }
