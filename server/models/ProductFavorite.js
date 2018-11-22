import mongoose from 'mongoose'
import { apiGet } from '@server/utils'
import stripHtml from 'string-strip-html'

const schema = new mongoose.Schema(
  {
    userId: String,
    productId: String
  },
  {
    timestamps: true
  }
)

if (!schema.options.toObject) schema.options.toObject = {}
schema.options.toObject.transform = function(doc, ret, options) {
  // remove the _id of every document before returning the result
  delete ret._id
  delete ret.userId
  return ret
}
schema.methods.toJSONAsync = function(callback) {
  const obj = this.toObject({ versionKey: false })
  const fields = [
    'id',
    'images',
    'product_type',
    'tags',
    'title',
    'body_html',
    'variants',
    'handle'
  ].join(',')
  // apiGet(`/admin/products/${obj.productId}.json?fields=${fields}`)
  //   .then(response=>callback(response.product));
  Promise.all([
    apiGet(`/admin/products/${obj.productId}.json?fields=${fields}`),
    apiGet(`/admin/products/${obj.productId}/metafields.json`)
  ]).then(([{ product }, { metafields }]) => {
    const findMetafield = (key, namespace = 'vaithuhay') => {
      const rs = metafields.find(
        m => m.key === key && m.namespace === namespace
      )
      if (!rs) return null
      return rs.value
    }

    const descObj = JSON.parse(findMetafield('desc'))
    if (descObj) product.desc = descObj.desc
    else {
      let d: string = stripHtml(product.body_html)
      if (d.length > 150) d = d.substring(0, 150) + '...'
      product.desc = {
        en: d,
        vi: d
      }
    }
    delete product.body_html
    callback(product)
  })
}

/**
 * @module model/PushNotiMessage
 * @constructor
 * @param {Object} _            initial PushNotiMessage object
 * @param {String} _.status     display message status
 * @param {Number} _.sendCount  display sending count
 * @return {PushNotiMessage}    new PushNotiMessage
 */
export default mongoose.model('ProductFavorite', schema)
