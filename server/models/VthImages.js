import mongoose from 'mongoose'
import fs from 'fs'

const schema = new mongoose.Schema({
  filename: String,
  url: String,
  host: String,
  thumbnails: Object,
  storage: [String]
})

schema.pre('remove', function() {
  for (const filePath of this.storage) fs.unlinkSync(filePath)
  console.log(this.filename + ' has been successfully deleted')
})

export default mongoose.model('VthImage', schema)
