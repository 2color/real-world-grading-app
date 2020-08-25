import { PrismaClient } from '@prisma/client'
import { TokenType } from '@prisma/client'
import { add } from 'date-fns'
import { AuthCredentials } from '@hapi/hapi'

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
    },
  })

  return {
    userId: testUser.id,
    tokenId: testUser.tokens[0].id,
    isAdmin: testUser.isAdmin,
  }
}
