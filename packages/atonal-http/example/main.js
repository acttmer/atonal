const path = require('path')
const { createHttp, cors } = require('../dist')

async function main() {
  const http = createHttp()

  await http.routesDirectory(path.resolve(__dirname, 'routes'))

  http.use(cors())

  http.listen(4000, '0.0.0.0', () => {
    console.log('Example API server is running')
  })
}

main()
