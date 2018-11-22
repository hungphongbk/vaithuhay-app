import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  email: {
    type: String,
    index: true,
    unique: true
  },
  name: String,
  phone: String,
  wish: String
})

export default mongoose.model('RecruitRegistration', schema)
