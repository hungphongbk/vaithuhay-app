import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  token: {
    type: String,
    unique: true
  },
  topics: Array
})
schema.statics.findOrCreate = function (cond) {
  const self = this;
  return new Promise(async resolve => {
    try {
      const obj = await self.findOne(cond).lean(false).exec();
      if (typeof obj === 'undefined' || obj === null) throw '';
      resolve(obj);
    } catch (err) {
      const obj = new self(cond);
      resolve(obj);
    }
  })
}

export default mongoose.model('PushNotiToken', schema);
