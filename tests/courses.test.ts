import { createServer } from '../src/server'
import Hapi, { AuthCredentials } from '@hapi/hapi'
import { createUserCredentials } from './test-helpers'
import { API_AUTH_STATEGY } from '../src/plugins/auth'

describe('courses endpoints', () => {
  let server: Hapi.Server
  let testUserCredentials: AuthCredentials
  let testAdminCredentials: AuthCredentials

  beforeAll(async () => {
    server = await createServer()

    // Create a test user and admin and get the credentials object for them
    testUserCredentials = await createUserCredentials(server.app.prisma, false)
    testAdminCredentials = await createUserCredentials(server.app.prisma, true)
  })

  afterAll(async () => {
    await server.stop()
  })

  let courseId: number

  test('create course', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/courses',
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
      payload: {
        name: 'Modern Backend with TypeScript, PostgreSQL, and Prisma',
        courseDetails:
          'Explore and demonstrate different patterns, problems, and architectures for a modern backend by solving a concrete problem: **a grading system for online courses.**',
      },
    })

    expect(response.statusCode).toEqual(201)

    courseId = JSON.parse(response.payload)?.id
    // 👇Update the credentials as they're static in tests (not fetched automatically on request by the auth plugin)
    testUserCredentials.teacherOf.push(courseId)
    expect(typeof courseId === 'number').toBeTruthy()
  })

  test('create course auth', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/courses',
      payload: {
        name: 'Modern Backend with TypeScript, PostgreSQL, and Prisma',
        courseDetails:
          'Explore and demonstrate different patterns, problems, and architectures for a modern backend by solving a concrete problem: **a grading system for online courses.**',
      },
    })
    expect(response.statusCode).toEqual(401)
  })

  test('create course validation', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/courses',
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
      payload: {
        name: 'name',
      },
    })

    expect(response.statusCode).toEqual(400)
  })

  test('get course returns 404 for non existant course', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/courses/9999',
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
    })

    expect(response.statusCode).toEqual(404)
  })

  test('get course returns course', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/courses/${courseId}`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
    })
    expect(response.statusCode).toEqual(200)
    const course = JSON.parse(response.payload)

    expect(course.id).toBe(courseId)
  })

  test('get courses returns courses with their tests', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/courses`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
    })
    expect(response.statusCode).toEqual(200)
    const course = JSON.parse(response.payload)

    expect(Array.isArray(course)).toBeTruthy()
    expect(course[0]?.id).toBeTruthy()
    expect(course[0]?.tests).toBeTruthy()
  })

  test('get course fails with invalid id', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/courses/a123',
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
    })
    expect(response.statusCode).toEqual(400)
  })

  test('update course fails with invalid courseId parameter', async () => {
    const response = await server.inject({
      method: 'PUT',
      url: `/courses/aa22`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
    })
    expect(response.statusCode).toEqual(400)
  })

  test('update course', async () => {
    const updatedName = 'test-UPDATED'

    const response = await server.inject({
      method: 'PUT',
      url: `/courses/${courseId}`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
      payload: {
        name: updatedName,
      },
    })
    expect(response.statusCode).toEqual(200)
    const course = JSON.parse(response.payload)
    expect(course.name).toEqual(updatedName)
  })

  test('update course as an admin', async () => {
    const updatedName = 'test-UPDATED-BY-ADMIN'

    const response = await server.inject({
      method: 'PUT',
      url: `/courses/${courseId}`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testAdminCredentials,
      },
      payload: {
        name: updatedName,
      },
    })
    expect(response.statusCode).toEqual(200)
    const course = JSON.parse(response.payload)
    expect(course.name).toEqual(updatedName)
  })

  test('delete course fails with invalid courseId parameter', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/courses/aa22`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
    })
    expect(response.statusCode).toEqual(400)
  })

  test('delete course', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/courses/${courseId}`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
    })
    expect(response.statusCode).toEqual(204)
  })
})
