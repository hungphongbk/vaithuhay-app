import { FirebaseAdmin as admin } from '../components'
import { promisify } from 'bluebird'
import moment from 'moment-timezone'

class Logging {
  constructor() {
    this.db = admin
      .database()
      .ref('vaithuhay')
      .child('logs')
    this.TYPES = {
      INFO: 'info',
      ERROR: 'err'
    }
  }

  _observeOrderNumber(_order_number: String | Object): String {
    let order_number = _order_number
    if (
      typeof _order_number === 'object' &&
      typeof _order_number !== 'undefined'
    ) {
      order_number = _order_number.order_number
    }
    return order_number
  }

  log(type, tags: Array<string>, context, additional = {}): Promise<any> {
    return this.db.push().set({
      status: type,
      context,
      createdAt: moment().format('DD-MM-YYYY HH:MM:SS'),
      tags,
      ...additional
    })
  }

  logOrderInfo(_order_number, info: Array<string>): Promise<any> {
    let order_number = this._observeOrderNumber(_order_number)

    return this.log(this.TYPES.INFO, ['order'], info.join('\n'), {
      order_number
    })
  }

  logOrderErr(_order_number, errObj): Promise<any> {
    let order_number = this._observeOrderNumber(_order_number)

    return this.log(this.TYPES.ERROR, ['order'], errObj.toString(), {
      order_number
    })
  }
}

export default new Logging()
