import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  name: String,
  promotionType: String,
  promotionDiscountAmount: Number,
  promotionApplyToResource: String,
  promotionApplyToId: String
})

const Promotions = mongoose.model('Promotions', schema)
export default Promotions
