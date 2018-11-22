import { Document, Model } from 'mongoose'

interface IPushNotiMessage extends Document {
  status: string
  sendFrom: string
  sendType: string
  sendTo: string
  sendCount: number
  message: Object
  options: Object
}

export const PushNotiMessage: Model<IPushNotiMessage>

interface IPushNotiToken extends Document {
  token: string
  topics: Array<string>
}

export const PushNotiToken: Model<IPushNotiToken>

interface IProductFavorite extends Document {
  userId: string
  productId: string
}

export const ProductFavorite: Model<IProductFavorite>
