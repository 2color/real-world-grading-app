import Hapi from '@hapi/hapi'
import Joi, { options } from '@hapi/joi'

// plugin to instantiate Prisma Client
const usersPlugin = {
  name: 'app/users',
  dependencies: ['prisma'],
  register: async function (server: Hapi.Server) {
    server.route([
      {
        method: 'GET',
        path: '/users/{userId}',
        handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
          // request.server.app.prisma
          return h.response(request.params.userId).code(200)
        },
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
            payload: Joi.object({
              firstName: Joi.string().required(),
              lastName: Joi.string().required(),
              email: Joi.string().email().required(),
              social: Joi.object({
                facebook: Joi.string().optional(),
                twitter: Joi.string().optional(),
                github: Joi.string().optional(),
                website: Joi.string().optional(),
              }).optional(),
            }),
            failAction: 'error',
          },
        },
      },
    ])
  },
}

export default usersPlugin

const registerValidator = Joi.object({
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

interface RegisterInput {
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

/**
 * Login/Registration handler
 * Generates a short lived verification token and sends an email
 */
async function registerHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app
  const payload = request.payload as RegisterInput

  try {
    await prisma.user.create({
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        social: JSON.stringify(payload.social),
      },
    })
    return h.response().code(200)
  } catch (err) {
    console.log(err)
  }

  //   const rows = await db('users')
  //     .select('user_id as userId')
  //     .where({ email })
  //   let userId
  //   if (rows.length === 0) {
  //     // user doesn't exist - persist first
  //     userId = await db('users')
  //       .insert({ email, verified: false })
  //       .returning('user_id')
  //       .then(([id]) => id)
  //   } else {
  //     userId = rows[0].userId
  //   }
  //   // Generate a new token
  //   const tokenId = await db('tokens')
  //     .insert({ user_id: userId, token_scope: AUTH_SCOPES.MAGICLINK })
  //     .returning('token_id')
  //     .then(([id]) => id)
  //   // generate token and send email
  //   const token = generateMagicLinkToken(tokenId)
  //   await sendMagicLink({
  //     refererHost,
  //     email,
  //     dao,
  //     token,
  //     network,
  //   })
  //   return h.response().code(200)
  // } catch (error) {
  //   return Boom.badImplementation(error.message)
  // }
}
