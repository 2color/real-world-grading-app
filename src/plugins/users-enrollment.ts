import Hapi from '@hapi/hapi'
import Joi, { object } from 'joi'
import Boom from '@hapi/boom'
import { UserRole } from '@prisma/client'
import { API_AUTH_STATEGY } from './auth'
import { isRequestedUserOrAdmin } from '../auth-helpers'

const usersEnrollmentPlugin = {
  name: 'app/usersEnrollment',
  dependencies: ['prisma'],
  register: async function (server: Hapi.Server) {
    server.route([
      {
        method: 'GET',
        path: '/users/{userId}/courses',
        handler: getUserEnrollmentsHandler,
        options: {
          pre: [isRequestedUserOrAdmin],
          auth: {
            mode: 'required',
            strategy: API_AUTH_STATEGY,
          },
          validate: {
            params: Joi.object({
              userId: Joi.number().integer(),
            }),
            failAction: (request, h, err) => {
              // show validation errors to user https://github.com/hapijs/hapi/issues/3706
              throw err
            },
          },
        },
      },
      {
        method: 'POST',
        path: '/users/{userId}/courses',
        handler: createUserEnrollmentHandler,
        options: {
          // TODO: ensure that only a teacher of a course can enroll other users as teachers
          pre: [isRequestedUserOrAdmin],
          auth: {
            mode: 'required',
            strategy: API_AUTH_STATEGY,
          },
          validate: {
            params: Joi.object({
              userId: Joi.number().integer(),
            }),
            payload: Joi.object({
              courseId: Joi.number().integer(),
              // 👇 Allow roles derived from the generated Prisma types
              role: Joi.string().valid(...Object.values(UserRole)),
            }),
            failAction: (request, h, err) => {
              // show validation errors to user https://github.com/hapijs/hapi/issues/3706
              throw err
            },
          },
        },
      },
      {
        method: 'DELETE',
        path: '/users/{userId}/courses/{courseId}',
        handler: deleteUserEnrollmentHandler,
        options: {
          pre: [isRequestedUserOrAdmin],
          auth: {
            mode: 'required',
            strategy: API_AUTH_STATEGY,
          },
          validate: {
            params: Joi.object({
              userId: Joi.number().integer(),
              courseId: Joi.number().integer(),
            }),
            failAction: (request, h, err) => {
              // show validation errors to user https://github.com/hapijs/hapi/issues/3706
              throw err
            },
          },
        },
      },
    ])
  },
}

export default usersEnrollmentPlugin

interface UserEnrollmentInput {
  courseId: number
  role: UserRole
}

async function getUserEnrollmentsHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  const { prisma } = request.server.app
  const userId = parseInt(request.params.userId, 10)

  try {
    const userCourses = await prisma.course.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
    })
    return h.response(userCourses).code(200)
  } catch (err) {
    request.log('error', err)
    return Boom.badImplementation('failed to get user')
  }
}

async function createUserEnrollmentHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  const { prisma } = request.server.app
  const userId = parseInt(request.params.userId, 10)
  const payload = request.payload as UserEnrollmentInput

  try {
    const userCourses = await prisma.courseEnrollment.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        course: {
          connect: {
            id: payload.courseId,
          },
        },
        role: payload.role,
      },
    })
    return h.response(userCourses).code(201)
  } catch (err) {
    request.log('error', err)
    return Boom.badImplementation('failed to update the user courses')
  }
}

async function deleteUserEnrollmentHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  const { prisma } = request.server.app
  const userId = parseInt(request.params.userId, 10)
  const courseId = parseInt(request.params.courseId, 10)

  try {
    await prisma.courseEnrollment.delete({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    })
    return h.response().code(204)
  } catch (err) {
    request.log('error', err)
    return Boom.badImplementation(
      `failed to delete the user: ${userId} enrollment in course: ${courseId} `,
    )
  }
}
