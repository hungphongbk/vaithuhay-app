import mongoose from 'mongoose';
import {promisify} from 'bluebird';
import {apiGet} from "@server/utils";

const schema = new mongoose.Schema({
  userId: String,
  productId: String
}, {
  timestamps: true
});

if (!schema.options.toObject) schema.options.toObject = {};
schema.options.toObject.transform = function (doc, ret, options) {
  // remove the _id of every document before returning the result
  delete ret._id;
  delete ret.userId;
  return ret;
};
schema.methods.toJSONAsync = function (callback) {
  const obj = this.toObject({versionKey: false});
  const fields = [
    'id', 'images', 'options', 'product_type',
    'tags', 'title', 'description', 'variants', 'handle'
  ].join(',');
  apiGet(`/admin/products/${obj.productId}.json?fields=${fields}`)
    .then(response=>callback(response.product));
};

/**
 * @module model/PushNotiMessage
 * @constructor
 * @param {Object} _            initial PushNotiMessage object
 * @param {String} _.status     display message status
 * @param {Number} _.sendCount  display sending count
 * @return {PushNotiMessage}    new PushNotiMessage
 */
export default mongoose.model('ProductFavorite', schema);
