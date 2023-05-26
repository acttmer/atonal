const { z } = require('zod')
const { defineRoute } = require('../../../../dist')

exports.GET = defineRoute({
  name: 'getUsers',
  method: 'GET',
  schema: {
    params: z.object({
      userId: z.number({ coerce: true }).int().min(1).transform(Number),
    }),
    res: z.object({
      userId: z.number(),
    }),
  },
  handler: req => {
    return { userId: req.params.userId }
  },
})
