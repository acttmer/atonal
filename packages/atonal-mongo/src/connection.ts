import { MongoClient, MongoClientOptions } from 'mongodb'
import { VirtualModel } from './model'

export interface EstablishMongoConnectionOptions {
  readonly url: string
  readonly options?: MongoClientOptions
  readonly ensureIndexes?: boolean
  readonly models?: readonly VirtualModel[]
}

export const establishMongoConnection = async ({
  url,
  options,
  ensureIndexes = false,
  models = [],
}: EstablishMongoConnectionOptions) => {
  const client = await MongoClient.connect(url, options)

  for (const model of models) {
    model.attach(client)

    if (ensureIndexes) {
      await model.ensureIndexes()
    }
  }

  return client
}
