import Boom from '@hapi/boom'
import Hapi from '@hapi/hapi'

// Pre function to check if user is the teacher of a course and can modify it
export async function isTeacherOfCourseOrAdmin(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  const { isAdmin, teacherOf } = request.auth.credentials

  if (isAdmin) {
    // If the user is an admin allow
    return h.continue
  }

  const courseId = parseInt(request.params.courseId, 10)

  if (teacherOf?.includes(courseId)) {
    return h.continue
  }
  // If the user is not a teacher of the course, deny access
  throw Boom.forbidden()
}

// Pre function to check if authenticated user is the grader of a testResult
export async function isGraderOfTestResultOrAdmin(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  const { userId, isAdmin, teacherOf } = request.auth.credentials

  if (isAdmin) {
    // If the user is an admin allow
    return h.continue
  }

  const testResultId = parseInt(request.params.testResultId, 10)
  const { prisma } = request.server.app

  const testResult = await prisma.testResult.findUnique({
    where: {
      id: testResultId,
    },
  })

  if (testResult?.graderId === userId) {
    return h.continue
  }
  // The authenticated user is not a teacher
  throw Boom.forbidden()
}

// Pre function to check if the authenticated user matches the requested user
export async function isRequestedUserOrAdmin(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  const { userId, isAdmin } = request.auth.credentials

  if (isAdmin) {
    // If the user is an admin allow
    return h.continue
  }

  const requestedUserId = parseInt(request.params.userId, 10)

  if (requestedUserId === userId) {
    return h.continue
  }

  // The authenticated user is not authorized
  throw Boom.forbidden()
}

// Pre function to check if the authenticated user matches the requested user
export async function isAdmin(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  if (request.auth.credentials.isAdmin) {
    // If the user is an admin allow
    return h.continue
  }

  // The authenticated user is not a teacher
  throw Boom.forbidden()
}

// Pre function to check if user is the teacher of a test's course
export async function isTeacherOfTestOrAdmin(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  const { isAdmin, teacherOf } = request.auth.credentials

  if (isAdmin) {
    // If the user is an admin allow
    return h.continue
  }

  const testId = parseInt(request.params.testId, 10)
  const { prisma } = request.server.app

  const test = await prisma.test.findUnique({
    where: {
      id: testId,
    },
    select: {
      course: {
        select: {
          id: true,
        },
      },
    },
  })

  if (test?.course.id && teacherOf.includes(test?.course.id)) {
    return h.continue
  }
  // The authenticated user is not a teacher
  throw Boom.forbidden()
}
