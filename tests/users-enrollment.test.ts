import { createServer } from '../src/server'
import Hapi, { AuthCredentials } from '@hapi/hapi'
import { createCourse, createUserCredentials } from './test-helpers'
import { API_AUTH_STATEGY } from '../src/plugins/auth'

describe('user specific courses endpoints', () => {
  let server: Hapi.Server
  let teacherCredentials: AuthCredentials
  let studentCredentials: AuthCredentials
  let studentId: number
  let teacherId: number
  let courseId: number

  beforeAll(async () => {
    server = await createServer()

    studentCredentials = await createUserCredentials(server.app.prisma, false)
    teacherCredentials = await createUserCredentials(server.app.prisma, false)
    courseId = await createCourse(server.app.prisma)
    studentId = studentCredentials.userId
    teacherId = teacherCredentials.userId
  })

  afterAll(async () => {
    await server.stop()
  })

  test(`add a user as a student to a course`, async () => {
    const response = await server.inject({
      method: 'POST',
      url: `/users/${studentId}/courses`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: studentCredentials,
      },
      payload: {
        courseId: courseId,
        role: 'STUDENT',
      },
    })
    expect(response.statusCode).toEqual(201)
    const userCourse = JSON.parse(response.payload)
    expect(userCourse.role).toEqual('STUDENT')
    expect(userCourse.userId).toEqual(studentId)
    expect(userCourse.courseId).toEqual(courseId)
  })

  test('add a user as a teacher to a course', async () => {
    const response = await server.inject({
      method: 'POST',
      url: `/users/${teacherId}/courses`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: teacherCredentials,
      },
      payload: {
        courseId: courseId,
        role: 'TEACHER',
      },
    })
    expect(response.statusCode).toEqual(201)
    const userCourse = JSON.parse(response.payload)
    expect(userCourse.role).toEqual('TEACHER')
    expect(userCourse.userId).toEqual(teacherId)
    expect(userCourse.courseId).toEqual(courseId)
  })

  test('add a user to a course validation', async () => {
    const response = await server.inject({
      method: 'POST',
      url: `/users/${teacherId}/courses`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: teacherCredentials,
      },
      payload: {
        courseId: courseId,
        role: 'NONEXISTANT',
      },
    })
    expect(response.statusCode).toEqual(400)
  })

  test('get user courses', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/users/${studentId}/courses`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: studentCredentials,
      },
    })
    expect(response.statusCode).toEqual(200)
    const userCourses = JSON.parse(response.payload)
    expect(userCourses[0]?.id).toEqual(courseId)
  })

  test('delete user enrollment in course', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/users/${studentId}/courses/${courseId}`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: studentCredentials,
      },
    })
    expect(response.statusCode).toEqual(204)
  })

  test('get user courses is empty after deletion', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/users/${studentId}/courses`,
      auth: {
        strategy: API_AUTH_STATEGY,
        credentials: studentCredentials,
      },
    })
    expect(response.statusCode).toEqual(200)
    const userCourses = JSON.parse(response.payload)
    expect(userCourses.length).toEqual(0)
  })
})
