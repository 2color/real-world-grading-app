import { createServer } from '../src/server'
import Hapi, { AuthCredentials } from '@hapi/hapi'
import { add } from 'date-fns'
import { createUserCredentials } from './test-helpers'
import { API_AUTH_STATEGY } from '../src/plugins/auth'

describe('tests endpoints', () => {
  let server: Hapi.Server
  let testUserCredentials: AuthCredentials
  let testAdminCredentials: AuthCredentials
  const weekFromNow = add(new Date(), { days: 7 })
  let testId: number
  let courseId: number

  beforeAll(async () => {
    server = await createServer()
    // Create a test user and admin and get the credentials object for them
    testUserCredentials = await createUserCredentials(server.app.prisma, false)
    testAdminCredentials = await createUserCredentials(server.app.prisma, true)
  })

  afterAll(async () => {
    await server.stop()
  })

  test('create test', async () => {
    const courseResponse = await server.inject({
      method: 'POST',
      url: '/courses',
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
      payload: {
        name: 'Modern Backend Course',
        courseDetails: 'Learn how to build a modern backend',
      },
    })
    expect(courseResponse.statusCode).toEqual(201)
    courseId = JSON.parse(courseResponse.payload)?.id
    // 👇Update the credentials as they're static in tests (not fetched automatically on request by the auth plugin)
    testUserCredentials.teacherOf.push(courseId)

    const testResponse = await server.inject({
      method: 'POST',
      url: `/courses/${courseId}/tests`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
      payload: {
        name: 'First Test',
        date: weekFromNow.toString(),
      },
    })

    expect(testResponse.statusCode).toEqual(201)

    testId = JSON.parse(testResponse.payload)?.id
    expect(typeof testId === 'number').toBeTruthy()
  })

  test('create test validation', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/courses',
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
      payload: {
        name: 'name',
        invalidField: 'woot',
      },
    })

    expect(response.statusCode).toEqual(400)
  })

  test('get course returns 404 for non existant course', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/courses/tests/9999',
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
    })

    expect(response.statusCode).toEqual(404)
  })

  test('get test returns test', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/courses/tests/${testId}`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
    })
    expect(response.statusCode).toEqual(200)
    const course = JSON.parse(response.payload)

    expect(course.id).toBe(testId)
  })

  test('get course fails with invalid id', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/courses/tests/a123',
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
    })
    expect(response.statusCode).toEqual(400)
  })

  test('update course fails with invalid testId parameter', async () => {
    const response = await server.inject({
      method: 'PUT',
      url: `/courses/tests/aa22`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
    })
    expect(response.statusCode).toEqual(400)
  })

  test('update course', async () => {
    const updatedName = 'test-UPDATED-NAME'

    const response = await server.inject({
      method: 'PUT',
      url: `/courses/tests/${testId}`,
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

  test('delete course fails with invalid testId parameter', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/courses/tests/aa22`,
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
      url: `/courses/tests/${testId}`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: testUserCredentials,
      },
    })
    expect(response.statusCode).toEqual(204)
  })
})
