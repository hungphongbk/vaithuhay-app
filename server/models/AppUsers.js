import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  id: String,
  email: {
    type: String,
    index: true,
    unique: true
  },
  name: String,
  avatar: String,
  permissions: Array
})

export default mongoose.model('AppUser', schema);
