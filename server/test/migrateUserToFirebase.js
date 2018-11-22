import AppUser from '../models/AppUsers'
const mongoose = require('mongoose')
import { FirebaseAdmin as admin } from '../components'
mongoose.Promise = global.Promise
mongoose.connect(
  'mongodb://hungphongbk:hungPhong1*!%40@localhost/vaithuhay',
  {
    //useMongoClient: true,
    poolSize: 2,
    promiseLibrary: global.Promise
  }
)
const db = admin
  .database()
  .ref('vaithuhay')
  .child('users')
async function action() {
  console.log('begin')
  const mongoDbUsers = await AppUser.find({}, '-_id -_v')
  console.log(`find ${mongoDbUsers.length} old users`)
  const createUser = mongoDbUser => db.push().set(mongoDbUser.toObject()),
    fbUsers = await Promise.all(mongoDbUsers.map(createUser))
}

export default async () => {
  await action()
  process.exit(0)
}
