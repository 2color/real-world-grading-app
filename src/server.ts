import Hapi from '@hapi/hapi'
import prismaPlugin from './plugins/prisma'
import usersPlugin from './plugins/users'
import usersEnrollmentPlugin from './plugins/users-enrollment'
import statusPlugin from './plugins/status'
import coursesPlugin from './plugins/courses'
import testsPlugin from './plugins/tests'
import testResultsPlugin from './plugins/test-results'

const server: Hapi.Server = Hapi.server({
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
})

export async function createServer(): Promise<Hapi.Server> {
  await server.register([
    statusPlugin,
    usersPlugin,
    usersEnrollmentPlugin,
    coursesPlugin,
    testsPlugin,
    testResultsPlugin,
    prismaPlugin,
  ])
  await server.initialize()

  return server
}

export async function startServer(server: Hapi.Server): Promise<Hapi.Server> {
  await server.start()
  console.log(`Server running on ${server.info.uri}`)
  return server
}

process.on('unhandledRejection', (err) => {
  console.log(err)
  process.exit(1)
})
