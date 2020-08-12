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

  let userId: number

  test('create user', async () => {
    const response = await server.inject({
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

    userId = JSON.parse(response.payload)?.id

    expect(response.statusCode).toEqual(200)
  })


  test('get user returns 404 for non existant user', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/users/123',
    })

    expect(response.statusCode).toEqual(404)
  })

  test('get user returns user', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/users/${userId}`,
    })
    expect(response.statusCode).toEqual(200)
    const user = JSON.parse(response.payload)

    expect(user.id).toBe(userId)
  })

  test('get user fails with invalid id', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/users/a123',
    })
    expect(response.statusCode).toEqual(400)
  })

  test('delete user', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/users/${userId}`,
    })
    expect(response.statusCode).toEqual(204)
  })
})
