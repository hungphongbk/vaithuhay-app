import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import ffmpeg from '@server/lib/ffmpeg/ffmpeg'

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
  urls: [String]
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

async function processVideo(instance) {
  const video = await new ffmpeg(instance.videoPath),
    files = await video.fnExtractFrameToJPG(instance.assetsDirectoryPath, {
      frame_rate: 25,
      quality: 3
    })

  instance.imagesPath = files
}

Images3DSchema.statics.upload = async function(videoBuffer, fileName) {
  console.log(fileName)
  const [assetsDirectoryPath, videoPath] = saveVideo(videoBuffer, fileName)

  const instance = new this({ assetsDirectoryPath, videoPath })

  await processVideo(instance)

  await instance.save()

  return instance
}

Images3DSchema.pre('remove', function(cb) {
  rimraf(this.assetsDirectoryPath, cb)
})

const Images3D = mongoose.model('3DImage', Images3DSchema)

export default Images3D
