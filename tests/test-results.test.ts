import { createServer } from '../src/server'
import Hapi, { AuthCredentials } from '@hapi/hapi'
import { add } from 'date-fns'
import { createCourseTestStudentTeacher } from './test-helpers'
import { API_AUTH_STATEGY } from '../src/plugins/auth'

describe('test results endpoints', () => {
  let server: Hapi.Server

  let teacherCredentials: AuthCredentials
  let studentCredentials: AuthCredentials
  let courseId: number
  let testId: number
  let studentId: number
  let teacherId: number
  let testResultId: number

  beforeAll(async () => {
    server = await createServer()
    // create a course, an associated test, and two users (student and teacher) to assign test results to
    const testData = await createCourseTestStudentTeacher(server.app.prisma)

    courseId = testData.courseId
    testId = testData.testId
    studentId = testData.studentId
    teacherId = testData.teacherId
    teacherCredentials = testData.teacherCredentials
    studentCredentials = testData.studentCredentials
  })

  afterAll(async () => {
    await server.stop()
  })

  test('create test result', async () => {
    const response = await server.inject({
      method: 'POST',
      url: `/courses/tests/${testId}/test-results`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: teacherCredentials,
      },
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
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: teacherCredentials,
      },
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
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: teacherCredentials,
      },
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
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: teacherCredentials,
      },
    })

    expect(response.statusCode).toEqual(200)
    const testResults = JSON.parse(response.payload)
    expect(testResults[0]?.testId).toEqual(testId)
    expect(testResults[0]?.result).toBeTruthy()
  })

  test('get test results for a specific test fails for student', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/courses/tests/${testId}/test-results`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: studentCredentials,
      },
    })

    expect(response.statusCode).toEqual(403)
  })

  test('get test results for a specific user', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/users/${studentId}/test-results`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: studentCredentials,
      },
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
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: teacherCredentials,
      },
    })

    expect(response.statusCode).toEqual(204)
  })
})
