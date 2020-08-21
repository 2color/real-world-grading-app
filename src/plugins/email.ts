import Hapi from '@hapi/hapi'
import Joi from '@hapi/joi'
import Boom from '@hapi/boom'

// Module augmentation to add shared application state
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/33809#issuecomment-472103564
declare module '@hapi/hapi' {
  interface ServerApplicationState {
    sendEmail(email: string, token: string): Promise<void>
  }
}

const emailPlugin = {
  name: 'app/email',
  register: async function (server: Hapi.Server) {
    server.app.sendEmail = sendEmail
  },
}

export default emailPlugin

// TODO: Implement actual email functionality
async function sendEmail(email: string, token: string) {
  console.log(`Send token: ${token} to email: ${email}`)
}
