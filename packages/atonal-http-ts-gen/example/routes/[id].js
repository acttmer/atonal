const { defineRoute } = require('@atonal/http')
const { z } = require('zod')

exports.GET = defineRoute({
  name: 'getMagicById',
  schema: {
    params: z.object({
      id: z.string(),
    }),
    responseData: z.object({
      say: z.string(),
    }),
  },
  handler: () => {
    return { say: 'Hello World' }
  },
})
