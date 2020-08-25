import { PrismaClient } from '@prisma/client'
import { TokenType, UserRole } from '@prisma/client'
import { add } from 'date-fns'
import { AuthCredentials } from '@hapi/hapi'

// Helper function to create a test user and return the credentials object the same way that the auth plugin does
export const createUserCredentials = async (
  prisma: PrismaClient,
  isAdmin: boolean,
): Promise<AuthCredentials> => {
  const testUser = await prisma.user.create({
    data: {
      email: `test-${Date.now()}@test.com`,
      isAdmin,
      tokens: {
        create: {
          expiration: add(new Date(), { days: 7 }),
          type: TokenType.API,
        },
      },
    },
    include: {
      tokens: true,
      courses: {
        where: {
          role: UserRole.TEACHER,
        },
        select: {
          courseId: true,
        },
      },
    },
  })

  return {
    userId: testUser.id,
    tokenId: testUser.tokens[0].id,
    isAdmin: testUser.isAdmin,
    teacherOf: testUser.courses?.map(({ courseId }) => courseId),
  }
}

// Helper function to create a course, test, student, and a teacher
export const createCourseTestStudentTeacher = async (
  prisma: PrismaClient,
): Promise<{
  courseId: number
  testId: number
  studentId: number
  teacherId: number
  studentCredentials: AuthCredentials
  teacherCredentials: AuthCredentials
}> => {
  const teacherCredentials = await createUserCredentials(prisma, false)
  const studentCredentials = await createUserCredentials(prisma, false)

  const now = Date.now().toString()
  const course = await prisma.course.create({
    data: {
      name: `test-course-${now}`,
      courseDetails: `test-course-${now}-details`,
      members: {
        create: [
          {
            role: UserRole.TEACHER,
            user: {
              connect: {
                id: teacherCredentials.userId,
              },
            },
          },
          {
            role: UserRole.STUDENT,
            user: {
              connect: {
                id: studentCredentials.userId,
              },
            },
          },
        ],
      },
      tests: {
        create: [
          {
            date: add(new Date(), { days: 7 }),
            name: 'First test',
          },
        ],
      },
    },
    include: {
      tests: true,
    },
  })

  // 👇Update the credentials as they're static in tests (not fetched automatically on request by the auth plugin)
  teacherCredentials.teacherOf.push(course.id)

  return {
    courseId: course.id,
    testId: course.tests[0].id,
    teacherId: teacherCredentials.userId,
    teacherCredentials,
    studentId: studentCredentials.userId,
    studentCredentials,
  }
}

// Helper function to create a course
export const createCourse = async (prisma: PrismaClient): Promise<number> => {
  const course = await prisma.course.create({
    data: {
      name: `test-course-${Date.now().toString()}`,
      courseDetails: `test-course-${Date.now().toString()}-details`,
    },
  })
  return course.id
}
