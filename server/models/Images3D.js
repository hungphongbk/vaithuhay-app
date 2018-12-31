import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import ffmpeg from '@server/lib/ffmpeg/ffmpeg'
import sortBy from 'lodash/sortBy'
import { UploadPathIntoUrl, verbose } from '@server/utils'
import { SOCKET_EV } from '@universal/consts'
import analyzeDiffImages from '@server/jobs/analyzeDiffImages.process'
import { fork } from 'child_process'

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
  const fps = 5

  const socketLog = (eventName, message) => {
    if (socket) {
      verbose('emit to frontend')
      socket.emit(eventName, { message })
    }
  }

  socketLog(
    SOCKET_EV.Image3d.UploadProgress,
    `Video has been uploaded.\nfps = 5. Begin extracting frames...`
  )

  // extract video frames into images
  let video = await new ffmpeg(instance.videoPath),
    files = await video.fnExtractFrameToJPG(instance.assetsDirectoryPath, {
      // number: 360,
      frame_rate: fps,
      quality: 3
    }),
    // sort file names by its index
    imgFiles = sortBy(files.slice(1), file => /_(\d+)\.jpg$/.exec(file)[1] * 1)

  verbose(`Total ${imgFiles.length} frames have been extracted :)`)
  socketLog(
    SOCKET_EV.Image3d.UploadProgress,
    `Total ${imgFiles.length} frames have been extracted :)`
  )
  socketLog(
    SOCKET_EV.Image3d.UploadProgress,
    `Begin analyzed extracted frames. Please wait...`
  )

  // detect duplication frames
  let width = 0,
    height = 0

  const lastFrame = imgFiles[imgFiles.length - 1]
  const analyzedFrames = imgFiles.slice(0, Math.floor(imgFiles.length / 3)),
    analyzedDupe = await new Promise(resolve => {
      const job = fork(analyzeDiffImages)
      job.send({
        frames: analyzedFrames,
        lastFrame
      })
      job.on('message', ({ event, data }) => {
        switch (event) {
          case 'progress':
            socketLog(SOCKET_EV.Image3d.UploadProgress, data.message)
            break
          case 'completed':
            width = data.width
            height = data.height
            resolve(data.analyzedDupe)
        }
      })
    })
  verbose(`Last frame is`, lastFrame)
  socketLog(SOCKET_EV.Image3d.UploadProgress, `Last frame is` + lastFrame)
  verbose(`Best matched with last frame is`, imgFiles[analyzedDupe.index])
  socketLog(
    SOCKET_EV.Image3d.UploadProgress,
    `Best matched with last frame is ` + imgFiles[analyzedDupe.index]
  )

  // remove every files from 0 to index (imgFiles)
  const toRemove = analyzedDupe.index + 1
  imgFiles.slice(0, toRemove).forEach(f => fs.unlinkSync(f))
  imgFiles = imgFiles.slice(toRemove)
  files = imgFiles

  // update and transform images into URLs
  instance.size = { width, height }
  instance.imagesPath = files
  instance.urls = files.map(UploadPathIntoUrl)
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
