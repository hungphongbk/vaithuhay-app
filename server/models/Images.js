import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  filename: String,
  url: String,
  thumbnails: Object,
  storage: String
})

export default mongoose.model('Image', schema)
