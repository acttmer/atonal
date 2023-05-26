const { defineRoute } = require('../../dist')

exports.GET = defineRoute({
  name: 'getMain',
  handler: () => {
    return { say: 'Hello World' }
  },
})
