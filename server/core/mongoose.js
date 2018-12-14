import mongoose from 'mongoose'
import tunnel from 'tunnel-ssh'
import fs from 'fs'

mongoose.Promise = global.Promise
const conf = {
  useNewUrlParser: true,
  // useMongoClient: true,
  poolSize: 2,
  promiseLibrary: global.Promise
}

function connectDevelopment() {
  const sshConfig = {
    host: '188.166.177.127',
    username: 'root',
    agent: process.env.SSH_AUTH_SOCK,
    privateKey: fs.readFileSync(process.env.DEV_SSH_PRIVATE_KEY, 'utf-8'),
    port: 2234,
    dstPort: 27017
  }

  return new Promise(resolve => {
    tunnel(sshConfig, (err, server) => {
      if (err) {
        console.error(err.message)
        return
      }
      console.log('SSH connection successfully')
      const connectPromise = mongoose.connect(
        'mongodb://hungphongbk:hungPhong1*!%40@localhost/vaithuhay',
        conf
      )
      var db = mongoose.connection
      db.on('error', console.error.bind(console, 'DB connection error:'))
      db.once('open', function() {
        console.log('DB connection successful')
      })
      resolve(connectPromise)
    })
  })
}
function connectProduction() {
  return mongoose.connect(
    'mongodb://hungphongbk:hungPhong1*!%40@localhost/vaithuhay',
    conf
  )
}

export default (process.env.NODE_ENV === 'development'
  ? connectDevelopment
  : connectProduction)
