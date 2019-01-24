import createQueue from '@server/jobs/classes/createQueue'
import { PROC_EV } from '@universal/consts'
import imageMin from 'imagemin'
import imageMinWebp from 'imagemin-webp'
import pngToJpeg from 'png-to-jpeg'
import axios from 'axios'
import md5 from 'md5'
import fs from 'fs'
import path from 'path'

const queue = createQueue(`img-${process.env.APP_RUNTIME_ENV}`)

queue.process(
  PROC_EV.ConvertImageToWebp,
  3,
  async ({ data: { uid, payload: url } }, done) => {
    let bufferResponse = await axios.get(url, {
        responseType: 'arraybuffer'
      }),
      buffer = new Buffer(bufferResponse.data, 'binary'),
      isPng = /\.png/g.test(url)

    if (isPng) buffer = await pngToJpeg({ quality: 90 })(buffer)
    const newFilenameWithoutExt = md5(url),
      newFilePath = ext =>
        path.join(
          process.env.APP_PATH,
          `../uploads/optimized/${newFilenameWithoutExt}.${ext}`
        )
    fs.writeFileSync(newFilePath('jpeg'), buffer, { encoding: 'binary' })

    buffer = await imageMin.buffer(buffer, {
      plugins: [imageMinWebp({ quality: 80 })]
    })
    fs.writeFileSync(newFilePath('webp'), buffer, { encoding: 'binary' })

    const returnUrl =
      process.env.APP_HOST +
      '/uploads/optimized/' +
      newFilenameWithoutExt +
      '.jpeg'

    process.send({ uid, payload: returnUrl })
    done()
  }
)

process.on('message', ({ type, uid, payload }) => {
  console.log(`${type}: ${payload}`)
  queue
    .create(type, { uid, payload })
    .removeOnComplete(true)
    .priority('high')
    .save(err => {
      if (err) {
        console.error(err)
        process.send({ err })
      }
    })
})
