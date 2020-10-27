import Hapi from '@hapi/hapi'
import Joi from 'joi'
import Boom from '@hapi/boom'
import { API_AUTH_STATEGY } from './auth'
import {
  isRequestedUserOrAdmin,
  isTeacherOfTestOrAdmin,
  isGraderOfTestResultOrAdmin,
} from '../auth-helpers'

const testResultsPlugin = {
  name: 'app/testResults',
  dependencies: ['prisma'],
  register: async function (server: Hapi.Server) {
    server.route([
      {
        method: 'GET',
        path: '/users/{userId}/test-results',
        handler: getUserTestResultsHandler,
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
        method: 'GET',
        path: '/courses/tests/{testId}/test-results',
        handler: getTestResultsHandler,
        options: {
          pre: [isTeacherOfTestOrAdmin],
          auth: {
            mode: 'required',
            strategy: API_AUTH_STATEGY,
          },
          validate: {
            params: Joi.object({
              testId: Joi.number().integer().integer(),
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
        path: '/courses/tests/{testId}/test-results',
        handler: createTestResultsHandler,
        options: {
          pre: [isTeacherOfTestOrAdmin],
          auth: {
            mode: 'required',
            strategy: API_AUTH_STATEGY,
          },
          validate: {
            params: Joi.object({
              testId: Joi.number().integer(),
            }),
            payload: createTestResultValidator,
            failAction: (request, h, err) => {
              // show validation errors to user https://github.com/hapijs/hapi/issues/3706
              throw err
            },
          },
        },
      },
      {
        method: 'PUT',
        path: '/courses/tests/test-results/{testResultId}',
        handler: updateTestResultHandler,
        options: {
          pre: [isGraderOfTestResultOrAdmin],
          auth: {
            mode: 'required',
            strategy: API_AUTH_STATEGY,
          },
          validate: {
            params: Joi.object({
              testResultId: Joi.number().integer(),
            }),
            payload: updateTestResultValidator,
            failAction: (request, h, err) => {
              // show validation errors to user https://github.com/hapijs/hapi/issues/3706
              throw err
            },
          },
        },
      },
      {
        method: 'DELETE',
        path: '/courses/tests/test-results/{testResultId}',
        handler: deleteTestResultHandler,
        options: {
          pre: [isGraderOfTestResultOrAdmin],
          auth: {
            mode: 'required',
            strategy: API_AUTH_STATEGY,
          },
          validate: {
            params: Joi.object({
              testResultId: Joi.number().integer(),
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

export default testResultsPlugin

// Once a test result is created, only the result can be updated.
const testResultInputValidator = Joi.object({
  result: Joi.number().integer().sign('positive').max(1000).required(),
  studentId: Joi.number()
    .integer()
    .alter({
      create: (schema) => schema.required(),
      update: (schema) => schema.forbidden(),
    }),
  graderId: Joi.number()
    .integer()
    .alter({
      create: (schema) => schema.required(),
      update: (schema) => schema.forbidden(),
    }),
})

const createTestResultValidator = testResultInputValidator.tailor('create')
const updateTestResultValidator = testResultInputValidator.tailor('update')

interface TestResultInput {
  result: number
  studentId: number
  graderId: number
}

async function getTestResultsHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  const { prisma } = request.server.app
  const testId = parseInt(request.params.testId, 10)

  try {
    const testResults = await prisma.testResult.findMany({
      where: {
        testId: testId,
      },
    })

    return h.response(testResults).code(200)
  } catch (err) {
    request.log('error', err)
    return Boom.badImplementation(
      `failed to get test results for test ${testId}`,
    )
  }
}

async function getUserTestResultsHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  const { prisma } = request.server.app
  const userId = parseInt(request.params.userId, 10)

  try {
    const userTestResults = await prisma.testResult.findMany({
      where: {
        studentId: userId,
      },
    })
    return h.response(userTestResults).code(200)
  } catch (err) {
    request.log('error', err)
    return Boom.badImplementation('failed to get user test results')
  }
}

async function createTestResultsHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  const { prisma } = request.server.app
  const payload = request.payload as TestResultInput
  const testId = parseInt(request.params.testId, 10)

  try {
    const createdTestResult = await prisma.testResult.create({
      data: {
        result: payload.result,
        student: {
          connect: { id: payload.studentId },
        },
        gradedBy: {
          connect: { id: payload.graderId },
        },
        test: {
          connect: {
            id: testId,
          },
        },
      },
    })
    return h.response(createdTestResult).code(201)
  } catch (err) {
    request.log('error', err)
    return Boom.badImplementation(
      `failed to create test result for testId: ${testId}`,
    )
  }
}

async function updateTestResultHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  const { prisma } = request.server.app
  const testResultId = parseInt(request.params.testResultId, 10)
  const payload = request.payload as Pick<TestResultInput, 'result'>

  try {
    // Only allow updating the result
    const updatedTestResult = await prisma.testResult.update({
      where: {
        id: testResultId,
      },
      data: {
        result: payload.result,
      },
    })
    return h.response(updatedTestResult).code(200)
  } catch (err) {
    request.log('error', err)
    return Boom.badImplementation('failed to update test result')
  }
}

async function deleteTestResultHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  const { prisma } = request.server.app
  const testResultId = parseInt(request.params.testResultId, 10)

  try {
    await prisma.testResult.delete({
      where: {
        id: testResultId,
      },
    })
    return h.response().code(204)
  } catch (err) {
    request.log('error', err)
    return Boom.badImplementation('failed to delete test result')
  }
}
