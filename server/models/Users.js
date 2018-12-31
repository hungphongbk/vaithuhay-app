import mongoose from 'mongoose'
import { apiGet } from '../utils/index'
import genetator from 'generate-password'
import btoa from 'btoa'
import { HrvAPISelector } from '@server/core/haravan-api'

const searchCustomerByEmailOrCreate = async (
  _email,
  { id, first_name, last_name, password }
) => {
  const create = async email => {
    console.log('time to create')
    const { customer } = await HrvAPISelector()
      .post('/admin/customers.json')
      .json({
        customer: {
          first_name,
          last_name,
          email,
          verified_email: true,
          password,
          password_confirmation: password,
          tags: 'facebook',
          metafields: [
            {
              key: 'facebook',
              value: id,
              value_type: String,
              namespace: 'vaithuhay'
            }
          ]
        }
      })
    return customer
  }

  const emailName = _email.split('@')[0],
    email = emailName + '+fb-vaithuhay@gmail.com',
    { customers } = await apiGet(
      `/admin/customers/search.json?query=${emailName}`,
      false
    )
  console.log(`QUERY: /admin/customers/search.json?query=${emailName}`)
  if (customers.length > 0) {
    console.log(customers)
    return customers.find(c => c.email === email) || (await create(email))
  } else return await create(email)
}
const encode = ({ email }, password) => btoa(email + ':' + password)

const schema = new mongoose.Schema({
  vthId: String,
  password: String,
  facebookProvider: {
    type: {
      id: String,
      accessToken: String
    },
    select: false
  }
})
schema.statics.createFbUser = function(
  accessToken,
  refreshToken,
  { _json },
  cb
) {
  const { id, email, first_name, last_name } = _json
  console.log(id, email, first_name, last_name)
  const self = this
  return self.findOne(
    {
      'facebookProvider.id': id
    },
    async (err, user) => {
      const password = genetator.generate({
          length: 12,
          numbers: true
        }),
        customer = await searchCustomerByEmailOrCreate(email, {
          id,
          first_name,
          last_name,
          password
        })
      console.log('Existing customer id: ' + customer.id)

      if (!user) {
        const newUser = new self({
          vthId: customer.id,
          password,
          facebookProvider: {
            id,
            accessToken
          }
        })
        newUser.save(error => {
          if (error) console.log(error)
          else cb(error, encode(customer, password))
        })
      } else {
        self.update(
          {
            'facebookProvider.id': id
          },
          {
            vthId: customer.id
          },
          () => cb(err, encode(customer, user.password))
        )
      }
    }
  )
}

export default mongoose.model('User', schema)
