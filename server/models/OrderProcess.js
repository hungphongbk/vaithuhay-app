import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  number: {
    type: String
  },
  processed: Boolean
}, {
  timestamps: true
})

export default mongoose.model('OrderProcess', schema);
