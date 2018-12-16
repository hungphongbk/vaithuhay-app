import mongoose from 'mongoose'

const schema = mongoose.schema({
  namespace: {
    type: String,
    default: 'vaithuhay'
  },
  key: String,
  value: {
    type: Object,
    default: () => ({})
  },
  resource: {
    type: String,
    Id: Number
  }
})

schema.pre('save', async function() {})

const Metafields = mongoose.model('HaravanMetafield', schema)
export default Metafields
