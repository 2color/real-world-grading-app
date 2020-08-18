import { createServer } from '../src/server'
import Hapi from '@hapi/hapi'

describe('courses endpoints', () => {
  let server: Hapi.Server

  beforeAll(async () => {
    server = await createServer()
  })

  afterAll(async () => {
    await server.stop()
  })

  let courseId: number

  test('create course', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/courses',
      payload: {
        name: 'Modern Backend with TypeScript, PostgreSQL, and Prisma',
        courseDetails: 'Explore and demonstrate different patterns, problems, and architectures for a modern backend by solving a concrete problem: **a grading system for online courses.**'
      },
    })

    expect(response.statusCode).toEqual(201)

    courseId = JSON.parse(response.payload)?.id
    expect(typeof courseId === 'number').toBeTruthy()
  })

  test('create course validation', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/courses',
      payload: {
        name: 'name'
      },
    })

    expect(response.statusCode).toEqual(400)
  })

  test('get course returns 404 for non existant course', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/courses/9999',
    })

    expect(response.statusCode).toEqual(404)
  })

  test('get course returns course', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/courses/${courseId}`,
    })
    expect(response.statusCode).toEqual(200)
    const course = JSON.parse(response.payload)

    expect(course.id).toBe(courseId)
  })

  test('get courses returns courses with their tests', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/courses`,
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
    })
    expect(response.statusCode).toEqual(400)
  })

  test('update course fails with invalid courseId parameter', async () => {
    const response = await server.inject({
      method: 'PUT',
      url: `/courses/aa22`,
    })
    expect(response.statusCode).toEqual(400)
  })

  test('update course', async () => {
    const updatedName = 'test-UPDATED'

    const response = await server.inject({
      method: 'PUT',
      url: `/courses/${courseId}`,
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
    })
    expect(response.statusCode).toEqual(400)
  })

  test('delete course', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/courses/${courseId}`,
    })
    expect(response.statusCode).toEqual(204)
  })
})
