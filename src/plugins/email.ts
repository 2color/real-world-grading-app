import Hapi from '@hapi/hapi'
import Joi from '@hapi/joi'
import Boom from '@hapi/boom'
import sendgrid from '@sendgrid/mail'

// Module augmentation to add shared application state
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/33809#issuecomment-472103564
declare module '@hapi/hapi' {
  interface ServerApplicationState {
    sendEmailToken(email: string, token: string): Promise<void>
  }
}

const emailPlugin = {
  name: 'app/email',
  register: async function (server: Hapi.Server) {
    if (!process.env.SENDGRID_API_KEY) {
      console.log(
        `the SENDGRID_API_KEY env var must be set, otherwise the API won't be able to send emauls`,
      )
      return
    }

    sendgrid.setApiKey(process.env.SENDGRID_API_KEY)
    server.app.sendEmailToken = sendEmailToken
  },
}

export default emailPlugin

async function sendEmailToken(email: string, token: string) {
  const msg = {
    to: email,
    from: 'norman@prisma.io',
    subject: 'Login token for the modern backend API',
    text: `The login token for the API is: ${token}`,
  }

  await sendgrid.send(msg)
}
