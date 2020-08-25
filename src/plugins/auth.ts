import Hapi from '@hapi/hapi'
import Joi from '@hapi/joi'
import Boom from '@hapi/boom'
import jwt from 'jsonwebtoken'
import { TokenType, UserRole } from '@prisma/client'
import { add, compareAsc } from 'date-fns'

declare module '@hapi/hapi' {
  interface AuthCredentials {
    userId: number
    tokenId: number
    isAdmin: boolean
    // 👇 The courseIds that a user is a teacher of, thereby granting him permissions to change entitites
    teacherOf: number[]
  }
}

const authPlugin: Hapi.Plugin<null> = {
  name: 'app/auth',
  dependencies: ['prisma', 'hapi-auth-jwt2'],
  register: async function (server: Hapi.Server) {
    if (!process.env.JWT_SECRET) {
      console.warn(
        'The JWT_SECRET env var is not set. This is unsafe! If running in production, set it.',
      )
    }

    const jwtAuthOptions = {
      key: JWT_SECRET,
      verifyOptions: { algorithms: [JWT_ALGORITHM] },
    }

    // long lived token pesisted in the user browser
    server.auth.strategy(API_AUTH_STATEGY, 'jwt', {
      ...jwtAuthOptions,
      validate: validateAPIToken,
    })

    // Require by default API token unless otherwise configured
    server.auth.default(API_AUTH_STATEGY)

    server.route([
      // Endpoint to login or regsiter and to send the short lived token
      {
        method: 'POST',
        path: '/login',
        handler: loginHandler,
        options: {
          auth: false,
          validate: {
            failAction: (request, h, err) => {
              // show validation errors to user https://github.com/hapijs/hapi/issues/3706
              throw err
            },
            payload: Joi.object({
              email: Joi.string().email().required(),
            }),
          },
        },
      },
      {
        // Endpoint to authenticate the magiclink and to generate a long lived token
        method: 'POST',
        path: '/authenticate',
        handler: authenticateHandler,
        options: {
          auth: false,
          validate: {
            payload: Joi.object({
              email: Joi.string().email().required(),
              emailToken: Joi.string().required(),
            }),
          },
        },
      },
    ])
  },
}
export default authPlugin

export const API_AUTH_STATEGY = 'API'

const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECRET_JWT_SECRET'

const JWT_ALGORITHM = 'HS256'

const EMAIL_TOKEN_EXPIRATION_MINUTES = 10
const AUTHENTICATION_TOKEN_EXPIRATION_HOURS = 12

const apiTokenSchema = Joi.object({
  tokenId: Joi.number().integer().required(),
  iat: Joi.any(),
  exp: Joi.any(),
})

interface APITokenPayload {
  tokenId: number
  iat: string
  exp: string
}

interface LoginInput {
  email: string
}

interface AuthenticateInput {
  email: string
  emailToken: string
}

// Function will be called on every
const validateAPIToken = async (
  decoded: APITokenPayload,
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) => {
  const { prisma } = request.server.app
  const { tokenId } = decoded
  const { error } = apiTokenSchema.validate(decoded)

  if (error) {
    request.log(['error', 'auth'], `API token error: ${error.message}`)
    return { isValid: false }
  }

  try {
    // Fetch the token from DB to verify it's valid
    const fetchedToken = await prisma.token.findOne({
      where: {
        id: tokenId,
      },
      include: {
        user: true,
      },
    })

    // Check if token could be found in database
    if (!fetchedToken) {
      return { isValid: false, errorMessage: 'Token not found' }
    }

    // Check token expiration
    if (fetchedToken.expiration < new Date()) {
      return { isValid: false, errorMessage: 'Token expired' }
    }

    if (fetchedToken.valid) {
      const teacherOf = await prisma.courseEnrollment.findMany({
        where: {
          userId: fetchedToken.userId,
          role: UserRole.TEACHER,
        },
        select: {
          courseId: true,
        },
      })

      // The token is valid. Pass the token payload (in `decoded`), userId, and isAdmin to `credentials`
      // which is available in route handlers via request.auth.credentials
      return {
        isValid: true,
        credentials: {
          ...decoded,
          userId: fetchedToken.userId,
          isAdmin: fetchedToken.user.isAdmin,
          // convert teacherOf into an array of courseIds
          teacherOf: teacherOf.map(({ courseId }) => courseId),
        },
      }
    }
  } catch (error) {
    request.log(['error', 'auth', 'db'], error)
    return { isValid: false, errorMessage: 'DB Error' }
  }

  return { isValid: false, errorMessage: 'User not found' }
}

/**
 * Login/Registration handler
 *
 * Because there are no passwords, the same endpoint is used for login and regsitration
 * Generates a short lived verification token and sends an email
 */
async function loginHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma, sendEmailToken } = request.server.app
  const { email } = request.payload as LoginInput
  const emailToken = generateEmailToken()
  const tokenExpiration = add(new Date(), {
    minutes: EMAIL_TOKEN_EXPIRATION_MINUTES,
  })

  try {
    // Create a short lived token and update user or create if they don't exist
    const createdToken = await prisma.token.create({
      data: {
        emailToken,
        type: TokenType.EMAIL,
        expiration: tokenExpiration,
        user: {
          connectOrCreate: {
            create: {
              email,
            },
            where: {
              email,
            },
          },
        },
      },
    })

    await sendEmailToken(email, emailToken)
    return h.response().code(200)
  } catch (error) {
    return Boom.badImplementation(error.message)
  }
}

async function authenticateHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  const { prisma } = request.server.app
  const { email, emailToken } = request.payload as AuthenticateInput

  try {
    // Get short lived email token
    const fetchedEmailToken = await prisma.token.findOne({
      where: {
        emailToken: emailToken,
      },
      include: {
        user: true,
      },
    })

    if (!fetchedEmailToken?.valid) {
      return Boom.unauthorized()
    }

    // If token matches the user email passed in the payload, generate long lived API token
    if (fetchedEmailToken && fetchedEmailToken.user.email === email) {
      const tokenExpiration = add(new Date(), {
        hours: AUTHENTICATION_TOKEN_EXPIRATION_HOURS,
      })
      // Persist token in DB so it's stateful
      const createdToken = await prisma.token.create({
        data: {
          type: TokenType.API,
          expiration: tokenExpiration,
          user: {
            connect: {
              email,
            },
          },
        },
      })

      // Invalidate the email token after it's been used
      await prisma.token.update({
        where: {
          id: fetchedEmailToken.id,
        },
        data: {
          valid: false,
        },
      })

      const authToken = generateApiToken(createdToken.id)
      return h.response().code(200).header('Authorization', authToken)
    } else {
      return Boom.unauthorized()
    }
  } catch (error) {
    return Boom.badImplementation(error.message)
  }
}

function generateApiToken(tokenId: number) {
  const jwtPayload = { tokenId }

  return jwt.sign(jwtPayload, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
  })
}

// Generate a random 8 digit number as the email token
function generateEmailToken(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString()
}
