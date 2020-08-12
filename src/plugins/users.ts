import Hapi from '@hapi/hapi'
import Joi from '@hapi/joi'

// plugin to instantiate Prisma Client
const usersPlugin = {
  name: 'app/users',
  dependencies: ['prisma'],
  register: async function (server: Hapi.Server) {
    server.route([
      {
        method: 'GET',
        path: '/users/{userId}',
        handler: getUserHandler,
        options: {
          validate: {
            params: Joi.object({
              userId: Joi.string().pattern(/^[0-9]+$/),
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
        path: '/users',
        handler: registerHandler,
        options: {
          validate: {
            payload: userInputValidator,
            failAction: (request, h, err) => {
              // show validation errors to user https://github.com/hapijs/hapi/issues/3706
              throw err
            },
          },
        },
      },
      {
        method: 'DELETE',
        path: '/users/{userId}',
        handler: deleteHandler,
        options: {
          validate: {
            params: Joi.object({
              userId: Joi.string().pattern(/^[0-9]+$/),
            }),
            failAction: (request, h, err) => {
              // show validation errors to user https://github.com/hapijs/hapi/issues/3706
              throw err
            },
          },
        },
      },
      {
        method: 'PUT',
        path: '/users/{userId}',
        handler: updateHandler,
        options: {
          validate: {
            params: Joi.object({
              userId: Joi.string().pattern(/^[0-9]+$/),
            }),
            payload: userInputValidator,
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

export default usersPlugin

const userInputValidator = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  social: Joi.object({
    facebook: Joi.string().optional(),
    twitter: Joi.string().optional(),
    github: Joi.string().optional(),
    website: Joi.string().optional(),
  }).optional(),
})

interface UserInput {
  firstName: string
  lastName: string
  email: string
  social: {
    facebook?: string
    twitter?: string
    github?: string
    website?: string
  }
}

async function getUserHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app
  const userId = request.params.userId as string

  try {
    const user = await prisma.user.findOne({
      where: {
        id: parseInt(userId, 10),
      },
    })
    if (!user) {
      return h.response().code(404)
    } else {
      return h.response(user).code(200)
    }
  } catch (err) {
    console.log(err)
    return h.response().code(500)
  }
}

async function registerHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app
  const payload = request.payload as UserInput

  try {
    const createdUser = await prisma.user.create({
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        // social: JSON.stringify(payload.social),
        social: payload.social,
      },
      select: {
        id: true,
      },
    })
    return h.response(createdUser).code(200)
  } catch (err) {
    console.log(err)
  }
}

async function deleteHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app
  const userId = request.params.userId as string

  try {
    await prisma.user.delete({
      where: {
        id: parseInt(userId, 10),
      },
    })
    return h.response().code(204)
  } catch (err) {
    console.log(err)
    return h.response().code(500)
  }
}

async function updateHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app
  const userId = request.params.userId as string
  const payload = request.payload as UserInput

  try {
    await prisma.user.update({
      where: {
        id: parseInt(userId, 10),
      },
      data: payload,
    })
    return h.response().code(204)
  } catch (err) {
    console.log(err)
    return h.response().code(500)
  }
}
