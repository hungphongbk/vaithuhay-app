import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import ffmpeg from '@server/lib/ffmpeg/ffmpeg'
import pixelmatch from 'pixelmatch'
import jpeg from 'jpeg-js'
import minBy from 'lodash/minBy'
import sortBy from 'lodash/sortBy'
import { UploadPathIntoUrl, verbose } from '@server/utils'
import { memoize } from 'async-decorators'
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

async function processVideo(instance, socket) {
  const socketLog = (eventName, message) =>
    socket && socket.emit(eventName, { message })

  // extract video frames into images
  let video = await new ffmpeg(instance.videoPath),
    files = await video.fnExtractFrameToJPG(instance.assetsDirectoryPath, {
      // number: 360,
      frame_rate: 5,
      quality: 3
    }),
    // sort file names by its index
    imgFiles = sortBy(files.slice(1), file => /_(\d+)\.jpg$/.exec(file)[1] * 1)

  verbose(`Total ${imgFiles.length} frames have been extracted :)`)
  socketLog(
    SOCKET_EV.Image3d.UploadProgress,
    `Total ${imgFiles.length} frames have been extracted :)`
  )

  // detect duplication frames
  const compare = (img1, img2) =>
    new Promise(resolve => {
      const fn = memoize(
        img =>
          new Promise((resolve$1, reject$1) =>
            fs.readFile(img, (err, data) => {
              if (err) {
                console.error('Unexpected when processing ' + img, err)
                reject$1(err)
                return
              }
              // console.log(data)
              resolve$1(jpeg.decode(data))
            })
          )
      )
      Promise.all([fn(img1), fn(img2)]).then(([img$1, img$2]) => {
        // console.log(img$1)
        resolve(
          pixelmatch(img$1.data, img$2.data, null, img$1.width, img$1.height)
        )
      })
    })

  const lastFrame = imgFiles[imgFiles.length - 1]
  let proceeded = 0
  const analyzedFrames = imgFiles.slice(0, Math.floor(imgFiles.length / 3)),
    analyzedData = await Promise.all(
      analyzedFrames.map((compareFrame, index) =>
        compare(lastFrame, compareFrame).then(value => {
          ++proceeded

          // report percentage
          const p = Math.round((proceeded * 1000) / analyzedFrames.length) / 10
          verbose.update(p + '% analyzed...')
          socketLog(SOCKET_EV.Image3d.UploadProgress, p + '% analyzed...')

          return { index, value }
        })
      )
    ),
    analyzedDupe = minBy(analyzedData, 'value')
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
