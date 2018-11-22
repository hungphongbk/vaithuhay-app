import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'

const schema = new mongoose.Schema(
  {
    category: String,
    key: String,
    value: String
  },
  {
    timestamps: true
  }
)
schema.plugin(mongoosePaginate)

export default mongoose.model('Logs', schema)
