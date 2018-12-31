import { memoize } from 'async-decorators'
import fs from 'fs'
import jpeg from 'jpeg-js'
import pixelmatch from 'pixelmatch'
import minBy from 'lodash/minBy'
import chunk from 'lodash/chunk'
import ffmpeg from '@server/lib/ffmpeg/ffmpeg'
import sortBy from 'lodash/sortBy'
import { SOCKET_EV } from '@universal/consts'
import { UploadPathIntoUrl } from '@universal/helpers'
import { compress } from '@server/routes/image'

let width, height
const send = (event, data) => process.send({ event, data })

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

process.on('message', async ({ videoObj, options }) => {
  const { videoPath, assetsDirectoryPath } = videoObj,
    { fps, quality } = Object.assign(
      {},
      {
        fps: 4,
        quality: 5
      },
      options
    )

  send(SOCKET_EV.Image3d.UploadProgress, {
    message: `Video has been uploaded.`
  })
  send(SOCKET_EV.Image3d.UploadProgress, {
    message: `fps = ${fps}. Begin extracting video into frames...`
  })

  let video = await new ffmpeg(videoPath),
    files = await video.fnExtractFrameToJPG(assetsDirectoryPath, {
      // number: 360,
      frame_rate: fps,
      quality
    }),
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
