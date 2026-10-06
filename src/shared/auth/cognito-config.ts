import 'server-only'
import { discovery, type Configuration } from 'openid-client'

let configPromise: Promise<Configuration> | null = null

export function getCognitoConfig(): Promise<Configuration> {
  if (!configPromise) {
    const issuerUrl = process.env.COGNITO_ISSUER_URL
    const clientId = process.env.COGNITO_CLIENT_ID
    const clientSecret = process.env.COGNITO_CLIENT_SECRET

    if (!issuerUrl || !clientId || !clientSecret) {
      throw new Error(
        'Faltan variables de entorno: COGNITO_ISSUER_URL, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET'
      )
    }

    configPromise = discovery(new URL(issuerUrl), clientId, clientSecret).catch((err) => {
      configPromise = null
      throw err
    })
  }

  return configPromise
}
