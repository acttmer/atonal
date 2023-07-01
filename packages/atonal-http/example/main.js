const { z } = require('zod')
const { createHttp, createRouter } = require('../dist')

async function main() {
  const router = createRouter()

  router.route({
    method: 'GET',
    path: '/',
    handler: () => {
      return { message: 'Hello World' }
    },
  })

  router.route({
    method: 'GET',
    path: '/users/:userId',
    schema: {
      params: z.object({
        userId: z.string(),
      }),
    },
    handler: req => {
      return { userId: req.params.userId }
    },
  })

  const http = createHttp()

  http.use(router.compile())

  http.handlers.onMiddlewareResult = (res, result) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        code: 0,
        message: 'Success',
        data: result,
      }),
    )
  }

  http.listen(4000, '0.0.0.0', () => {
    console.log('Example API server is running')
  })
}

main()
