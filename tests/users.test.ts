import { init } from '../src/server'
import Hapi from '@hapi/hapi'

describe('POST /users - create user', () => {
  let server: Hapi.Server

  beforeAll(async () => {
    server = await init()
    // await server.app.prisma.user.deleteMany({})
  })

  afterAll(async () => {
    server.stop()
  })

  test('create user', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        name: 'test-name',
        email: `test-${Date.now()}@prisma.io`,
        social: {
          twitter: 'thisisalice',
          website: 'https://www.thisisalice.com'
        }
      }
    })
    expect(res.statusCode).toEqual(200)
    console.log(res.payload)
    // const response = JSON.parse(res.payload)
    // expect(response.up).toEqual(true)

    // const data = await prisma.user.findMany({ take: 1, select: { id: true } })
    // expect(data).toBeTruthy()
  })


  test('get user', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/users/123',
    })
    expect(response.statusCode).toEqual(200)
    expect(response.payload).toEqual('123')

    // const data = await prisma.user.findMany({ take: 1, select: { id: true } })
    // expect(data).toBeTruthy()
  })

  test('get user fails with invalid id', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/users/a123',
    })
    console.log(response)
    expect(response.statusCode).toEqual(400)

    // const data = await prisma.user.findMany({ take: 1, select: { id: true } })
    // expect(data).toBeTruthy()
  })
})
