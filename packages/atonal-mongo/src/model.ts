import {
  AggregateOptions,
  BulkWriteOptions,
  CountDocumentsOptions,
  DeleteOptions,
  Document,
  EstimatedDocumentCountOptions,
  Filter,
  FindOneAndDeleteOptions,
  FindOneAndUpdateOptions,
  FindOptions,
  IndexSpecification,
  InsertOneOptions,
  MongoClient,
  ObjectId,
  OneOrMore,
  OptionalUnlessRequiredId,
  UpdateFilter,
  UpdateOptions,
} from 'mongodb'
import {
  BaseModel,
  DepopulateRef,
  FillableDocument,
  Index,
  ModelFields,
} from './interface'
import {
  arrayToMap,
  isReadonlyArray,
  omitUndefinedObjectValues,
  traversalGet,
  traversalReplace,
} from './utils'

export interface ExtraUpdateOptions {
  timestamps?: boolean
}

export interface PopulateField<
  Model extends BaseModel,
  RefModel extends BaseModel,
> {
  model: VirtualModel<RefModel>
  path: ModelFields<Model>
  select?: ModelFields<RefModel>[]
  pipe?: (docs: RefModel[]) => Promise<RefModel[] | void> | RefModel[] | void
}

export interface VirtualModelOptions<Model extends BaseModel> {
  name: string
  timestamps?: boolean
  indexes?: Index<Model>[]
}

export class VirtualModel<
  Model extends BaseModel = any,
  DepopulatedModel extends DepopulateRef<Model> = DepopulateRef<Model>,
> {
  private readonly client: MongoClient | null
  private readonly opts: VirtualModelOptions<Model>

  constructor(opts: VirtualModelOptions<Model>) {
    this.client = null
    this.opts = opts
  }

  attach(client: MongoClient) {
    Object.assign(this, { client })
    return this
  }

  detach() {
    Object.assign(this, { client: null })
    return this
  }

  initializeOrderedBulkOp(opts?: BulkWriteOptions) {
    return this.collection.initializeOrderedBulkOp(opts)
  }

  initializeUnorderedBulkOp(opts?: BulkWriteOptions) {
    return this.collection.initializeUnorderedBulkOp(opts)
  }

  aggregate<T extends Model>(pipeline: object[], opts?: AggregateOptions) {
    return this.collection.aggregate<T>(pipeline, opts)
  }

  async create(
    doc: FillableDocument<DepopulatedModel>,
    opts: InsertOneOptions = {},
  ) {
    const insertion = omitUndefinedObjectValues(doc)

    if (this.opts.timestamps) {
      const now = new Date()

      if (!insertion.hasOwnProperty('createdAt')) {
        Object.assign(insertion, { createdAt: now })
      }

      if (!insertion.hasOwnProperty('updatedAt')) {
        Object.assign(insertion, { updatedAt: now })
      }
    }

    await this.collection.insertOne(
      insertion as unknown as OptionalUnlessRequiredId<Model>,
      opts,
    )

    return insertion as unknown as Model
  }

  async createMany(
    docs: FillableDocument<DepopulatedModel>[],
    opts: BulkWriteOptions = {},
  ) {
    const insertions = docs.map(omitUndefinedObjectValues)

    if (this.opts.timestamps) {
      const now = new Date()

      for (const insertion of insertions) {
        if (!insertion.hasOwnProperty('createdAt')) {
          Object.assign(insertion, { createdAt: now })
        }

        if (!insertion.hasOwnProperty('updatedAt')) {
          Object.assign(insertion, { updatedAt: now })
        }
      }
    }

    await this.collection.insertMany(
      insertions as unknown as OptionalUnlessRequiredId<Model>[],
      opts,
    )

    return insertions as unknown as Model[]
  }

  find(
    filter: Filter<DepopulatedModel> = {},
    opts: FindOptions<DepopulatedModel> = {},
  ) {
    return this.collection.find(
      omitUndefinedObjectValues(filter) as Filter<Model>,
      opts,
    )
  }

  findOne(
    filter: Filter<DepopulatedModel>,
    opts: FindOptions<DepopulatedModel> = {},
  ) {
    return this.collection.findOne(
      omitUndefinedObjectValues(filter) as Filter<Model>,
      opts,
    )
  }

  findById(_id: ObjectId, opts: FindOptions<DepopulatedModel> = {}) {
    return this.findOne({ _id } as Filter<DepopulatedModel>, opts)
  }

  async exists(cond: OneOrMore<ObjectId> | Filter<DepopulatedModel>) {
    if (isReadonlyArray(cond)) {
      const items = await this.find(
        { _id: { $in: cond } } as Filter<DepopulatedModel>,
        { projection: { _id: 1 } },
      ).toArray()

      return items.length === cond.length
    } else if (cond instanceof ObjectId) {
      const item = await this.findById(cond, {
        projection: { _id: 1 },
      })

      return item !== null
    } else {
      const item = await this.findOne(omitUndefinedObjectValues(cond), {
        projection: { _id: 1 },
      })

      return item !== null
    }
  }

  updateOne(
    filter: Filter<DepopulatedModel>,
    update: UpdateFilter<Model>,
    { timestamps = true, ...opts }: UpdateOptions & ExtraUpdateOptions = {},
  ) {
    if (this.opts.timestamps && timestamps) {
      this.updateTimestamps(update)
    }

    return this.collection.updateOne(
      omitUndefinedObjectValues(filter) as Filter<Model>,
      update as UpdateFilter<Model>,
      opts,
    )
  }

  updateById(
    _id: ObjectId,
    update: UpdateFilter<Model>,
    opts: UpdateOptions & ExtraUpdateOptions = {},
  ) {
    return this.updateOne({ _id } as Filter<DepopulatedModel>, update, opts)
  }

  updateMany(
    filter: Filter<DepopulatedModel>,
    update: UpdateFilter<Model>,
    { timestamps = true, ...opts }: UpdateOptions & ExtraUpdateOptions = {},
  ) {
    if (this.opts.timestamps && timestamps) {
      this.updateTimestamps(update)
    }

    return this.collection.updateMany(
      omitUndefinedObjectValues(filter) as Filter<Model>,
      update as UpdateFilter<Model>,
      opts,
    )
  }

  async findOneAndUpdate(
    filter: Filter<DepopulatedModel>,
    update: UpdateFilter<Model>,
    {
      timestamps = true,
      ...opts
    }: FindOneAndUpdateOptions & ExtraUpdateOptions = {},
  ) {
    if (this.opts.timestamps && timestamps) {
      this.updateTimestamps(update)
    }

    const { value } = await this.collection.findOneAndUpdate(
      omitUndefinedObjectValues(filter) as Filter<Model>,
      update as UpdateFilter<Model>,
      opts,
    )

    return value
  }

  findByIdAndUpdate(
    _id: ObjectId,
    update: UpdateFilter<Model>,
    opts: FindOneAndUpdateOptions & ExtraUpdateOptions = {},
  ) {
    return this.findOneAndUpdate(
      { _id } as Filter<DepopulatedModel>,
      update,
      opts,
    )
  }

  deleteOne(filter: Filter<DepopulatedModel>, opts: DeleteOptions = {}) {
    return this.collection.deleteOne(
      omitUndefinedObjectValues(filter) as Filter<Model>,
      opts,
    )
  }

  deleteById(_id: ObjectId, opts: DeleteOptions = {}) {
    return this.deleteOne({ _id } as Filter<DepopulatedModel>, opts)
  }

  deleteMany(filter: Filter<DepopulatedModel>, opts: DeleteOptions = {}) {
    return this.collection.deleteMany(
      omitUndefinedObjectValues(filter) as Filter<Model>,
      opts,
    )
  }

  async findOneAndDelete(
    filter: Filter<DepopulatedModel>,
    opts: FindOneAndDeleteOptions = {},
  ) {
    const { value } = await this.collection.findOneAndDelete(
      omitUndefinedObjectValues(filter) as Filter<Model>,
      opts,
    )

    return value
  }

  findByIdAndDelete(_id: ObjectId, opts: FindOneAndDeleteOptions = {}) {
    return this.findOneAndDelete({ _id } as Filter<DepopulatedModel>, opts)
  }

  countDocuments(
    filter: Filter<DepopulatedModel> = {},
    opts: CountDocumentsOptions = {},
  ) {
    return this.collection.countDocuments(
      omitUndefinedObjectValues(filter) as Filter<Model>,
      opts,
    )
  }

  estimatedDocumentCount(opts: EstimatedDocumentCountOptions = {}) {
    return this.collection.estimatedDocumentCount(opts)
  }

  async populate(docs: Model[], items: OneOrMore<PopulateField<Model, any>>) {
    if (docs.length === 0) {
      return docs
    }

    // If the "populate" argument is an array, repeatly populate each of them
    if (isReadonlyArray(items)) {
      for (const item of items) {
        await this.populate(docs, item)
      }

      return docs
    }

    const { model, path, select = [], pipe } = items

    // Traverse all docs to get ref ids based on the "paths"
    const refIds = docs.flatMap(doc => traversalGet<ObjectId>(doc, path))

    if (refIds.length === 0) {
      return docs
    }

    const queryBuilder = model.aggregate([])

    // Query for ref docs by their _id
    queryBuilder.match({ _id: { $in: refIds } })

    // If "select" is not empty, transform it into a projection
    if (select.length > 0) {
      const projection: Document = {}

      for (const item of select) {
        projection[item] = 1
      }

      queryBuilder.project(projection)
    }

    // Fetch ref docs
    let refDocs = await queryBuilder.toArray()

    // Run the pipeline
    if (pipe) {
      const results = await pipe(refDocs)

      if (results) {
        refDocs = results
      }
    }

    // Traverse all the docs and replace all ref ids with fetched ref docs
    if (refDocs.length > 0) {
      const refDocMap = arrayToMap(refDocs, '_id')

      for (const doc of docs) {
        traversalReplace(doc, refDocMap, path)
      }
    }

    return docs
  }

  async createIndex(index: Index<Model>) {
    if (Array.isArray(index)) {
      const [indexSpec, options = {}] = index

      await this.collection.createIndex(
        indexSpec as IndexSpecification,
        options,
      )
    } else {
      await this.collection.createIndex(index as IndexSpecification)
    }
  }

  async ensureIndexes() {
    if (!this.opts.indexes) return

    for (const index of this.opts.indexes) {
      await this.createIndex(index)
    }
  }

  get collection() {
    if (this.client === null) {
      throw new Error('MongoClient is not attached')
    }

    return this.client.db().collection<Model>(this.opts.name)
  }

  private updateTimestamps(update: UpdateFilter<Model>) {
    if (update.$set) {
      if (!update.$set.hasOwnProperty('updatedAt')) {
        Object.assign(update.$set, {
          updatedAt: new Date(),
        })
      }
    } else {
      Object.assign(update, {
        $set: {
          updatedAt: new Date(),
        },
      })
    }
  }
}

export const defineModel = <Model extends BaseModel>(
  opts: VirtualModelOptions<Model>,
) => new VirtualModel(opts)
