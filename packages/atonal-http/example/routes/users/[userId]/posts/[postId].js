const { z } = require('zod')
const { defineRoute } = require('../../../../../dist')

exports.GET = defineRoute({
  name: 'getUserPost',
  method: 'GET',
  schema: {
    params: z.object({
      userId: z.number({ coerce: true }).int().min(1).transform(Number),
      postId: z.number({ coerce: true }).int().min(1).transform(Number),
    }),
  },
  handler: req => {
    return {
      userId: req.params.userId,
      postId: req.params.postId,
    }
  },
})
