import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'

const schema = new mongoose.Schema(
  {
    status: String,
    sendFrom: String,
    sendType: String,
    sendTo: String,
    sendCount: {
      type: Number,
      default: 0
    },
    message: Object,
    options: Object
  },
  {
    timestamps: true
  }
)
schema.plugin(mongoosePaginate)

/**
 * @module model/PushNotiMessage
 * @constructor
 * @param {Object} _            initial PushNotiMessage object
 * @param {String} _.status     display message status
 * @param {Number} _.sendCount  display sending count
 * @return {PushNotiMessage}    new PushNotiMessage
 */
export default mongoose.model('PushNotiMessage', schema)
