import { createServer } from '../src/server'
import Hapi from '@hapi/hapi'

describe('user specific courses endpoints', () => {
  let server: Hapi.Server
  let studentId: number
  let teacherId: number
  let courseId: number

  beforeAll(async () => {
    server = await createServer()
    // create two users and a course to test enrollment
    const studentResponse = await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        firstName: 'test-first-name',
        lastName: 'test-last-name',
        email: `test-student-${Date.now()}@prisma.io`
      },
    })
    expect(studentResponse.statusCode).toEqual(201)
    studentId = JSON.parse(studentResponse.payload)?.id
    
    const teacherResponse = await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        firstName: 'test-first-name',
        lastName: 'test-last-name',
        email: `test-teacher-${Date.now()}@prisma.io`
      },
    })
    expect(teacherResponse.statusCode).toEqual(201)
    teacherId = JSON.parse(teacherResponse.payload)?.id

    const courseResponse = await server.inject({
      method: 'POST',
      url: '/courses',
      payload: {
        name: 'Modern Backend with TypeScript, PostgreSQL, and Prisma',
        courseDetails: 'Explore and demonstrate different patterns, problems, and architectures for a modern backend by solving a concrete problem: **a grading system for online courses.**'
      },
    })

    expect(courseResponse.statusCode).toEqual(201)
    courseId = JSON.parse(courseResponse.payload)?.id
  })

  afterAll(async () => {
    await server.stop()
  })

  test(`add a user as a student to a course`, async () => {

    const response = await server.inject({
      method: 'POST',
      url: `/users/${studentId}/courses`,
      payload: { 
        courseId: courseId,
        role: 'STUDENT'
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
      payload: { 
        courseId: courseId,
        role: 'TEACHER'
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
      payload: { 
        courseId: courseId,
        role: 'NONEXISTANT'
      },
    })
    expect(response.statusCode).toEqual(400)
  })

  test('get user courses', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/users/${studentId}/courses`,
    })
    expect(response.statusCode).toEqual(200)
    const userCourses = JSON.parse(response.payload)
    expect(userCourses[0]?.id).toEqual(courseId)
  })

  test('delete user enrollment in course', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: `/users/${studentId}/courses/${courseId}`,
    })
    expect(response.statusCode).toEqual(204)
  })

  test('get user courses is empty after deletion', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/users/${studentId}/courses`,
    })
    expect(response.statusCode).toEqual(200)
    const userCourses = JSON.parse(response.payload)
    expect(userCourses.length).toEqual(0)
  })
})
