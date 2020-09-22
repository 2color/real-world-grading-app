import Hapi from '@hapi/hapi'
import hapiAuthJWT from 'hapi-auth-jwt2'
import prismaPlugin from './plugins/prisma'
import emailPlugin from './plugins/email'
import usersPlugin from './plugins/users'
import usersEnrollmentPlugin from './plugins/users-enrollment'
import statusPlugin from './plugins/status'
import coursesPlugin from './plugins/courses'
import testsPlugin from './plugins/tests'
import authPlugin from './plugins/auth'
import testResultsPlugin from './plugins/test-results'
import dotenv from 'dotenv'
import hapiPino from 'hapi-pino'
import * as HapiSwagger from 'hapi-swagger'
import Inert from '@hapi/inert'
import Vision from '@hapi/vision'

dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'

const server: Hapi.Server = Hapi.server({
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
})

const swaggerOptions: HapiSwagger.RegisterOptions = {
  info: {
    title: 'real-world-grading-app API Documentation',
  },
}

export async function createServer(): Promise<Hapi.Server> {

  // Register the logger
  await server.register([
    {
      plugin: hapiPino,
      options: {
        prettyPrint: process.env.NODE_ENV !== 'production',
        // Redact Authorization headers, see https://getpino.io/#/docs/redaction
        redact: ['req.headers.authorization'],
      },
    },
    {
      plugin: HapiSwagger,
      options: swaggerOptions,
    },
  ])
  await server.register([
    hapiAuthJWT,
    authPlugin,
    prismaPlugin,
    emailPlugin,
    statusPlugin,
    usersPlugin,
    usersEnrollmentPlugin,
    coursesPlugin,
    testsPlugin,
    testResultsPlugin,
    Inert,
    Vision,
  ])

  await server.initialize()

  return server
}

export async function startServer(server: Hapi.Server): Promise<Hapi.Server> {
  await server.start()
  server.log('info', `Server running on ${server.info.uri}`)
  return server
}

process.on('unhandledRejection', (err) => {
  console.log(err)
  process.exit(1)
})
