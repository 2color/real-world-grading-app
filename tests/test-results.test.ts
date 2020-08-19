import { createServer } from '../src/server'
import Hapi from '@hapi/hapi'
import { add } from 'date-fns'

describe('test results endpoints', () => {
  let server: Hapi.Server

  let testId: number
  let courseId: number
  let studentId: number
  let teacherId: number
  let testResultId: number

  beforeAll(async () => {
    server = await createServer()

    // create a course, an associated test, and two users (student and teacher) to assign test results to
    const courseResponse = await server.inject({
      method: 'POST',
      url: '/courses',
      payload: {
        name: 'Modern Backend Course',
        courseDetails: 'Learn how to build a modern backend',
      },
    })
    expect(courseResponse.statusCode).toEqual(201)
    courseId = JSON.parse(courseResponse.payload)?.id

    const weekFromNow = add(new Date(), { days: 7 })

    const testResponse = await server.inject({
      method: 'POST',
      url: `/courses/${courseId}/tests`,
      payload: {
        name: 'First Test',
        date: weekFromNow.toString(),
      },
    })
    testId = JSON.parse(testResponse.payload)?.id

    expect(testResponse.statusCode).toEqual(201)

    const studentResponse = await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        firstName: 'test-student',
        lastName: 'test-student',
        email: `test-student-${Date.now()}@prisma.io`,
      },
    })
    expect(studentResponse.statusCode).toEqual(201)
    studentId = JSON.parse(studentResponse.payload)?.id

    const teacherResponse = await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        firstName: 'test-teacher',
        lastName: 'test-teacher',
        email: `test-teacher-${Date.now()}@prisma.io`,
      },
    })
    teacherId = JSON.parse(teacherResponse.payload)?.id

    const studentCourseResponse = await server.inject({
      method: 'POST',
      url: `/users/${studentId}/courses`,
      payload: {
        courseId: courseId,
        role: 'STUDENT',
      },
    })
    expect(studentCourseResponse.statusCode).toEqual(201)

    const teacherCourseResponse = await server.inject({
      method: 'POST',
      url: `/users/${teacherId}/courses`,
      payload: {
        courseId: courseId,
        role: 'TEACHER',
      },
    })
    expect(teacherCourseResponse.statusCode).toEqual(201)
  })

  afterAll(async () => {
    await server.stop()
  })

  test('create test result', async () => {
    const response = await server.inject({
      method: 'POST',
      url: `/courses/tests/${testId}/test-results`,
      payload: {
        result: 950,
        studentId: studentId,
        graderId: teacherId,
      },
    })
    expect(response.statusCode).toEqual(201)
    const testResult = JSON.parse(response.payload)
    expect(typeof testResult.id === 'number').toBeTruthy()
    testResultId = testResult.id
  })

  test('create test result validation', async () => {
    const response = await server.inject({
      method: 'POST',
      url: `/courses/tests/${testId}/test-results`,
      payload: {
        result: 1001,
      },
    })
    // Should return 400 because of missing fields
    expect(response.statusCode).toEqual(400)
  })

  test('update test result', async () => {
    const response = await server.inject({
      method: 'PUT',
      url: `/courses/tests/test-results/${testResultId}`,
      payload: {
        result: 1000,
      },
    })
    expect(response.statusCode).toEqual(200)
    const testResult = JSON.parse(response.payload)
    expect(typeof testResult.id === 'number').toBeTruthy()
  })

  test('get test results for a specific test', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/courses/tests/${testId}/test-results`,
    })

    expect(response.statusCode).toEqual(200)
    const testResults = JSON.parse(response.payload)
    expect(testResults[0]?.testId).toEqual(testId)
    expect(testResults[0]?.result).toBeTruthy()
  })

  

  test('get test results for a specific user', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/users/${studentId}/test-results`,
    })

    expect(response.statusCode).toEqual(200)
    const testResults = JSON.parse(response.payload)
    expect(testResults[0]?.testId).toEqual(testId)
    expect(testResults[0]?.result).toEqual(1000)
  })



  test('delete test result', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/courses/tests/test-results/${testResultId}`,
    })

    expect(response.statusCode).toEqual(204)
  })
})
