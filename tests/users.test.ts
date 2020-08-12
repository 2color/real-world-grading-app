import { createServer } from '../src/server'
import Hapi from '@hapi/hapi'

describe('POST /users - create user', () => {
  let server: Hapi.Server

  beforeAll(async () => {
    server = await createServer()
  })

  afterAll(async () => {
    await server.stop()
  })

  test('create user', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        firstName: 'test-first-name',
        lastName: 'test-last-name',
        email: `test-${Date.now()}@prisma.io`,
        social: {
          twitter: 'thisisalice',
          website: 'https://www.thisisalice.com'
        }
      }
    })
    expect(res.statusCode).toEqual(200)
  })


  test('get user', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/users/123',
    })
    expect(response.statusCode).toEqual(200)
    expect(response.payload).toEqual('123')
  })

  test('get user fails with invalid id', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/users/a123',
    })
    expect(response.statusCode).toEqual(400)
  })
})
