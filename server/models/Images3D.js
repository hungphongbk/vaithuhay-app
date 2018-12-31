import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import { newProcess, verbose } from '@server/utils'
import { SOCKET_EV } from '@universal/consts'

const IMAGES_3D_PATH = path.resolve(
  global.APP_PATH || path.resolve(__dirname, '../'),
  '../uploads/3d'
)

const Images3DSchema = new mongoose.Schema({
  host: {
    type: String,
    default: global.APP_HOST || 'https://localhost:8089'
  },
  videoPath: String,
  imagesPath: [String],
  assetsDirectoryPath: String,
  urls: [String],
  size: {
    width: Number,
    height: Number
  }
})
Images3DSchema.set('toJSON', { virtuals: true })

/**
 *
 * @param {Buffer} videoBuffer
 * @param {string} fileName
 */
function saveVideo(videoBuffer, fileName) {
  const [fileNameWithoutExt] = fileName.split('.'),
    assetDirectoryPath = path.join(IMAGES_3D_PATH, fileNameWithoutExt),
    videoPath = path.join(assetDirectoryPath, fileName)

  if (!fs.existsSync(assetDirectoryPath)) fs.mkdirSync(assetDirectoryPath)

  fs.writeFileSync(videoPath, videoBuffer)
  return [assetDirectoryPath, videoPath]
}

async function processVideo(instance, socket) {
  console.log('process video')
  const fps = 4

  const socketLog = (eventName, message) => {
    if (socket) {
      socket.emit(eventName, { message })
    }
  }

  const newInstance = await new Promise(resolve => {
    const job = newProcess('make-image-sphere')
    job.send({ videoObj: instance, options: { fps } })
    job.on('message', ({ event, data }) => {
      switch (event) {
        case SOCKET_EV.Image3d.UploadProgress:
          socketLog(event, data.message)
          break
        case SOCKET_EV.Image3d.UploadProcessed:
          resolve(data)
      }
    })
  })

  Object.assign(instance, newInstance)
}

Images3DSchema.statics.upload = async function(videoBuffer, fileName, socket) {
  // console.log(fileName)
  const [assetsDirectoryPath, videoPath] = saveVideo(videoBuffer, fileName)

  const instance = new this({ assetsDirectoryPath, videoPath })

  await processVideo(instance, socket)

  await instance.save()

  return instance
}

Images3DSchema.pre('remove', function(cb) {
  rimraf(this.assetsDirectoryPath, cb)
})

const Images3D = mongoose.model('3DImage', Images3DSchema)

export default Images3D
