import createQueue from '@server/jobs/classes/createQueue'
import { PROC_EV } from '@universal/consts'
import imageMin from 'imagemin'
import imageMinWebp from 'imagemin-webp'
import pngToJpeg from 'png-to-jpeg'
import axios from 'axios'
import md5 from 'md5'
import fs from 'fs'
import path from 'path'
import { retryPromise } from '@server/utils/helpers'

const httpClient = axios.create({
  timeout: 3000,
  responseType: 'arraybuffer'
})

const queue = createQueue(`img-${process.env.APP_RUNTIME_ENV}`),
  sizeList = [null, 'thumb', 'medium', 'large', 'grande', 'master'],
  regex = new RegExp(`_(${sizeList.slice(1).join('|')})$`, 'g')

async function downloadAncOptimizeThumbnail(_url, size = null) {
  // process.nextTick(() => {
  //   console.log(size + ' ' + _url)
  // })
  const newFilenameWithoutExt = md5(_url)

  // transform url into appropriate thumbnail size
  let sizeSuffix = size ? '_' + size : '',
    { dir: url, name, ext } = path.parse(_url)

  if (size) {
    if (!regex.test(name)) name += '_' + size
    else name = name.replace(regex, '_' + size)
  }

  //normalize url
  url += '/' + name + ext

  let bufferResponse
  try {
    bufferResponse = await retryPromise(() => httpClient.get(url), 0, 5)
  } catch (e) {
    throw e
    return
  }
  let buffer = new Buffer(bufferResponse.data, 'binary'),
    isPng = /\.png/g.test(url)

  if (isPng) buffer = await pngToJpeg({ quality: 90 })(buffer)

  const newFilePath = ext =>
    path.join(
      process.env.APP_PATH,
      `../uploads/optimized/${newFilenameWithoutExt}${sizeSuffix}.${ext}`
    )
  fs.writeFileSync(newFilePath('jpeg'), buffer, { encoding: 'binary' })

  buffer = await imageMin.buffer(buffer, {
    plugins: [imageMinWebp({ quality: 80 })]
  })
  fs.writeFileSync(newFilePath('webp'), buffer, { encoding: 'binary' })

  return newFilenameWithoutExt
}

queue.process(
  PROC_EV.ConvertImageToWebp,
  1,
  async ({ data: { uid, payload: url } }, done) => {
    let newFilenameWithoutExt, rest
    try {
      ;[newFilenameWithoutExt, ...rest] = await Promise.all(
        sizeList.map(size => downloadAncOptimizeThumbnail(url, size))
      )
    } catch (e) {
      console.error(e)
      done(e)
      return
    }

    const returnUrl =
      process.env.APP_HOST +
      '/uploads/optimized/' +
      newFilenameWithoutExt +
      '.jpeg'

    process.send({ uid, payload: returnUrl })
    console.log('done task')
    done()
  }
)

process.on('message', ({ type, uid, payload }) => {
  console.log(`${type}: ${payload}`)
  const job = queue
    .create(type, { uid, payload })
    .removeOnComplete(true)
    .priority('high')
  job.attempts(3).backoff({ delay: 50 })
  job.save(err => {
    if (err) {
      console.error(err)
      process.send({ err })
    }
  })
})
