import Hapi from '@hapi/hapi'
import Joi from '@hapi/joi'
import Boom from '@hapi/boom'

const testsPlugin = {
  name: 'app/tests',
  dependencies: ['prisma'],
  register: async function (server: Hapi.Server) {
    server.route([
      {
        method: 'GET',
        path: '/courses/tests/{testId}',
        handler: getTestHandler,
        options: {
          validate: {
            params: Joi.object({
              testId: Joi.number().integer(),
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
        path: '/courses/{courseId}/tests',
        handler: createTestHandler,
        options: {
          validate: {
            params: Joi.object({
              courseId: Joi.number().integer(),
            }),
            payload: createTestValidator,
            failAction: (request, h, err) => {
              // show validation errors to user https://github.com/hapijs/hapi/issues/3706
              throw err
            },
          },
        },
      },
      {
        method: 'PUT',
        path: '/courses/tests/{testId}',
        handler: updateTestHandler,
        options: {
          validate: {
            params: Joi.object({
              testId: Joi.number().integer(),
            }),
            payload: updateTestValidator,
            failAction: (request, h, err) => {
              // show validation errors to user https://github.com/hapijs/hapi/issues/3706
              throw err
            },
          },
        },
      },
      {
        method: 'DELETE',
        path: '/courses/tests/{testId}',
        handler: deleteTestHandler,
        options: {
          validate: {
            params: Joi.object({
              testId: Joi.number().integer(),
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

export default testsPlugin

const testInputValidator = Joi.object({
  name: Joi.string().alter({
    create: (schema) => schema.required(),
    update: (schema) => schema.optional(),
  }),
  date: Joi.date().alter({
    create: (schema) => schema.required(),
    update: (schema) => schema.optional(),
  }),
})

const createTestValidator = testInputValidator.tailor('create')
const updateTestValidator = testInputValidator.tailor('update')

interface TestInput {
  name: string
  date: Date
}

async function getTestHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app
  const testId = parseInt(request.params.testId, 10)

  try {
    const test = await prisma.test.findOne({
      where: {
        id: testId,
      },
    })
    if (!test) {
      return h.response().code(404)
    } else {
      return h.response(test).code(200)
    }
  } catch (err) {
    console.log(err)
    return Boom.badImplementation('failed to get test')
  }
}

async function createTestHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  const { prisma } = request.server.app
  const payload = request.payload as TestInput
  const courseId = parseInt(request.params.courseId, 10)


  try {
    const createdTest = await prisma.test.create({
      data: {
        name: payload.name,
        date: payload.date,
        course: {
          connect: {
            id: courseId
          }
        }
      },
    })
    return h.response(createdTest).code(201)
  } catch (err) {
    console.log(err)
    return Boom.badImplementation('failed to create test')
  }
}

async function deleteTestHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  const { prisma } = request.server.app
  const testId = parseInt(request.params.testId, 10)

  try {
    await prisma.test.delete({
      where: {
        id: testId,
      },
    })
    return h.response().code(204)
  } catch (err) {
    console.log(err)
    return Boom.badImplementation('failed to delete test')
  }
}

async function updateTestHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  const { prisma } = request.server.app
  const testId = parseInt(request.params.testId, 10)
  const payload = request.payload as Partial<TestInput>

  try {
    const updatedTest = await prisma.test.update({
      where: {
        id: testId,
      },
      data: payload,
    })
    return h.response(updatedTest).code(200)
  } catch (err) {
    console.log(err)
    return Boom.badImplementation('failed to update test')
  }
}
