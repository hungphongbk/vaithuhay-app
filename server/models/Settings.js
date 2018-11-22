import mongoose from 'mongoose'
import i18n from 'mongoose-i18n-localize'
import findOrCreate from 'mongoose-findorcreate'

const schema = new mongoose.Schema({
  namespace: String,
  key: String,
  value: {
    type: Object,
    i18n: true
  }
})
schema.plugin(i18n, {
  locales: ['en', 'vi']
})
schema.plugin(findOrCreate)
export default mongoose.model('Setting', schema)
