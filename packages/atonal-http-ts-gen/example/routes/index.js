const { defineRoute } = require('@atonal/http')
const { z } = require('zod')

class ObjectId {
  static createFromHexString(hex) {
    return new ObjectId(hex)
  }

  constructor(hex) {
    this.hex = hex
  }
}

exports.GET = defineRoute({
  name: 'getApp',
  schema: {
    query: z.object({
      userId: z.string().transform(ObjectId.createFromHexString),
      isOptional: z.boolean({ coerce: true }),
    }),
    responseData: z.object({
      say: z.string(),
    }),
  },
  handler: () => {
    return { say: 'Hello World' }
  },
})
