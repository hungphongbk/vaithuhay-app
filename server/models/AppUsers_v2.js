import { FirebaseAdmin as admin } from '../components'
import _ from 'lodash'
const db = admin.database().ref('vaithuhay/users')

export default class AppUsers {
  static findAll() {
    return new Promise(resolve =>
      db.on('value', snapshot => resolve(snapshot.val()))
    )
  }
  static findById(id) {
    return new Promise(resolve =>
      db.child(id).on('value', snapshot => resolve(snapshot.val()))
    )
  }
  static async find(query = {}) {
    const users = await this.findAll()
    if (JSON.stringify(query) === '{}') return users.map(u => new this(u))
    return users
      .filter(user => {
        for (const [key, val] in Object.entries(query)) {
          if (user[key] !== val) return false
        }
        return true
      })
      .map(u => new this(u))
  }

  constructor(initial = {}) {
    Object.assign(this, initial)
  }
  toObject() {
    return _.pick(this, ['avatar', 'name', 'email', 'permissions'])
  }
}
