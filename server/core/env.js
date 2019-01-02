import path from 'path'
import * as dotenv from 'dotenv'

function loadEnv(environment) {
  const stage = process.env.NODE_ENV === 'development' ? 'dev' : 'production',
    envFilePath = path.resolve(
      process.cwd(),
      `config/.env.${environment}.${stage}`
    ),
    envBootstrapPath = path.resolve(process.cwd(), `config/.env.${stage}`)

  console.log(`load env file: ${envBootstrapPath}`)
  console.log(`load env file: ${envFilePath}`)
  dotenv.config({ path: envBootstrapPath })
  dotenv.config({ path: envFilePath })

  const merges = ['APP_HOST']
  merges.forEach(envVar => {
    global[envVar] = process.env[envVar]
  })
}

module.exports = loadEnv
