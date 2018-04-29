import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: String,
  productId: String
}, {
  timestamps: true
});

/**
 * @module model/PushNotiMessage
 * @constructor
 * @param {Object} _            initial PushNotiMessage object
 * @param {String} _.status     display message status
 * @param {Number} _.sendCount  display sending count
 * @return {PushNotiMessage}    new PushNotiMessage
 */
export default mongoose.model('ProductFavorite', schema);
