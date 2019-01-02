import { memoize } from 'async-decorators'
import fs from 'fs'
import jpeg from 'jpeg-js'
import pixelmatch from 'pixelmatch'
import minBy from 'lodash/minBy'
import chunk from 'lodash/chunk'
import FFMPEG from '@server/lib/ffmpeg/ffmpeg'
import sortBy from 'lodash/sortBy'
import { SOCKET_EV } from '@universal/consts'
import { UploadPathIntoUrl } from '@universal/helpers'
import { compress } from '@server/routes/image'

let width, height, video
const send = (event, data) => {
  process.env.APP_RUNTIME_ENV === 'cli' &&
    data.message &&
    console.log(data.message)
  process.send({ event, data })
}

const compare = (img1, img2, seed = 0) =>
  new Promise(resolve => {
    const fn = memoize(
      (img, seed) =>
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
      if (!(width && height)) {
        width = img$1.width
        height = img$1.height
      }
      // console.log(img$1)
      resolve(
        pixelmatch(img$1.data, img$2.data, null, img$1.width, img$1.height)
      )
    })
  })

const generateFrameImages = async (
  videoPath,
  assetsDirectoryPath,
  _options = {},
  preview = false
) => {
  if (!video) video = await FFMPEG(videoPath)
  const options = Object.assign({}, _options)
  if (preview) {
    options.size = '480x?'
    options.quality = 3
  }
  return await video.fnExtractFrameToJPG(assetsDirectoryPath, options)
}

process.on('message', async ({ videoObj, options }) => {
  const { videoPath, assetsDirectoryPath } = videoObj,
    { fps, quality, size = null } = Object.assign(
      {},
      {
        fps: 4,
        quality: 5
      },
      options
    ),
    generateThumbnailOptions = { frame_rate: fps, quality, size }

  send(SOCKET_EV.Image3d.UploadProgress, {
    message: `Video has been uploaded.`
  })
  send(SOCKET_EV.Image3d.UploadProgress, {
    message: `Begin extracting video into preview frames for analyzing...`
  })

  // only generate in preview mode for fast analyze
  let files = await generateFrameImages(
      videoPath,
      assetsDirectoryPath,
      generateThumbnailOptions,
      true
    ),
    // sort file names by its index
    imgFiles = sortBy(files.slice(1), file => /_(\d+)\.jpg$/.exec(file)[1] * 1),
    lastFrame = imgFiles[imgFiles.length - 1],
    frames = imgFiles.slice(0, Math.floor(imgFiles.length / 3))

  send(SOCKET_EV.Image3d.UploadProgress, {
    message: `Total ${imgFiles.length} frames have been extracted :)`
  })
  send(SOCKET_EV.Image3d.UploadProgress, {
    message: `Begin analyzed extracted frames. Please wait...`
  })

  let proceeded = 0
  const analyzed = await Promise.all(
    frames.map((compareFrame, index) =>
      compare(lastFrame, compareFrame).then(value => {
        ++proceeded

        // report percentage
        const p = Math.round((proceeded * 100) / frames.length)
        send(SOCKET_EV.Image3d.UploadProgress, { message: p + '% analyzed...' })

        return { index, value }
      })
    )
  )
  const analyzedDupe = minBy(analyzed, 'value')

  send(SOCKET_EV.Image3d.UploadProgress, {
    message: `Best matched with last frame is ` + analyzedDupe.index
  })

  // generate real images,
  // no need to re-assign into `files` variable due to same names,
  // just re-generate content
  width = null
  height = null
  send(SOCKET_EV.Image3d.UploadProgress, {
    message: `Begin extracting video into real frames...`
  })
  await generateFrameImages(
    videoPath,
    assetsDirectoryPath,
    generateThumbnailOptions
  )
  send(SOCKET_EV.Image3d.UploadProgress, {
    message: `Completed!`
  })
  await compare(lastFrame, lastFrame, 1) // force recalculate width & height

  // remove every files from 0 to index (imgFiles)
  const toRemove = analyzedDupe.index + 1
  imgFiles.slice(0, toRemove).forEach(f => fs.unlinkSync(f))
  imgFiles = imgFiles.slice(toRemove)
  files = imgFiles

  // send(SOCKET_EV.Image3d.UploadProgress, {
  //   message: 'Compressing image sphere...'
  // })
  // const chunks = chunk(files, 5)
  // for (const chunk of chunks) {
  //   await Promise.all(
  //     chunk.map(async imgPath => {
  //       const buf = await compress(imgPath)
  //       await new Promise((resolve, reject) => {
  //         fs.writeFile(imgPath, buf, err => {
  //           if (err) {
  //             console.error(err)
  //             reject(err)
  //           } else resolve()
  //         })
  //       })
  //     })
  //   )
  //   console.log('done chunk')
  // }
  // send(SOCKET_EV.Image3d.UploadProgress, {
  //   message: 'Completed...'
  // })

  const newVideoObj = Object.assign({}, videoObj, {
    size: { width, height },
    imagesPath: files,
    urls: files.map(UploadPathIntoUrl)
  })
  send(SOCKET_EV.Image3d.UploadProcessed, newVideoObj)
})
