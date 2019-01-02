import path from 'path'
const yenv = require('yenv')

function loadEnv(_environment) {
  const environment = _environment || 'web',
    stage = process.env.NODE_ENV === 'development' ? 'dev' : 'production'

  const envs = yenv(path.resolve(process.cwd(), 'config/env.yaml'), {
    env: `${environment}-${stage}`
  })
  Object.keys(envs).forEach(function(key) {
    if (!process.env.hasOwnProperty(key) || !process.env[key]) {
      process.env[key] = envs[key]
    }
  })
  console.log('Load env from env.yaml, env = ' + `${environment}-${stage}`)

  const merges = ['APP_HOST', 'APP_RUNTIME_ENV']
  merges.forEach(envVar => {
    global[envVar] = process.env[envVar]
  })

  return envs
}

module.exports = loadEnv
