import { createServer } from '../src/server'
import Hapi from '@hapi/hapi'
import { add } from 'date-fns'

describe('/tests endpoints', () => {
  let server: Hapi.Server

  beforeAll(async () => {
    server = await createServer()
  })

  afterAll(async () => {
    await server.stop()
  })

  const weekFromNow = add(new Date(), { days: 7 })
  let testId: number
  let courseId: number


  test('create test', async () => {
    const courseResponse = await server.inject({
      method: 'POST',
      url: '/courses',
      payload: {
        name: 'Modern Backend Course',
        courseDetails: 'Learn how to build a modern backend'
      },
    })
    expect(courseResponse.statusCode).toEqual(201)
    courseId = JSON.parse(courseResponse.payload)?.id


    const testResponse = await server.inject({
      method: 'POST',
      url: `/courses/${courseId}/tests`,
      payload: {
        name: 'First Test',
        date: weekFromNow.toString()
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
      payload: {
        name: 'name',
        invalidField: 'woot'
      },
    })

    expect(response.statusCode).toEqual(400)
  })

  test('get course returns 404 for non existant course', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/courses/tests/9999',
    })

    expect(response.statusCode).toEqual(404)
  })

  test('get test returns test', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/courses/tests/${testId}`,
    })
    expect(response.statusCode).toEqual(200)
    const course = JSON.parse(response.payload)

    expect(course.id).toBe(testId)
  })

  test('get course fails with invalid id', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/courses/tests/a123',
    })
    expect(response.statusCode).toEqual(400)
  })

  test('update course fails with invalid testId parameter', async () => {
    const response = await server.inject({
      method: 'PUT',
      url: `/courses/tests/aa22`,
    })
    expect(response.statusCode).toEqual(400)
  })

  test('update course', async () => {
    const updatedName = 'test-UPDATED-NAME'

    const response = await server.inject({
      method: 'PUT',
      url: `/courses/tests/${testId}`,
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
    })
    expect(response.statusCode).toEqual(400)
  })

  test('delete course', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/courses/tests/${testId}`,
    })
    expect(response.statusCode).toEqual(204)
  })
})
