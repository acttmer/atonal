const { createHttp } = require('@atonal/http')
const path = require('path')
const { generateClientFromHttp } = require('../dist')

async function main() {
  const http = createHttp()

  await http.routesDirectory(path.resolve(__dirname, 'routes'))

  await generateClientFromHttp(http, {
    outputPath: path.resolve(__dirname, 'client.ts'),
  })
}

main()
