import mongoose from 'mongoose'
import devSSHTunnel from '@server/core/dev-tunnel'

mongoose.Promise = global.Promise
const conf = {
  useNewUrlParser: true,
  // useMongoClient: true,
  poolSize: 2,
  promiseLibrary: global.Promise
}

function connectDevelopment() {
  return new Promise(resolve => {
    devSSHTunnel(() => {
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
