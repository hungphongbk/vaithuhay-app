import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import mime from 'mime-types'
import Image from '../models/Images'
import imagemin from 'imagemin'
import jpegtran from 'imagemin-jpegtran'
import pngquant from 'imagemin-pngquant'
import fs from 'fs'
import gm$ from 'gm'
import zipObject from 'lodash/zipObject'

const gm = gm$.subClass({ imageMagick: true }),
  router = Router(),
  imageUrl = url => path.join(global.APP_PATH, url),
  storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, imageUrl('../uploads'))
    },
    filename: function(req, file, cb) {
      crypto.randomBytes(8, function(err, raw) {
        cb(
          null,
          raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype)
        )
      })
    }
  }),
  upload = multer({ storage }),
  plugins = [
    jpegtran({ progressive: true }),
    // mozjpeg({quality: 90}),
    // ...((process.env.NODE_ENV === 'production') ? [
    //   __non_webpack_require__('imagemin-mozjpeg')({quality: 90})
    // ] : []),
    pngquant({ quality: '65-80' })
  ]

//Process images middleware
const widths = [80, 150, 300, 400, 600, 1200, 1920]

/**
 * Fix error "Stream yields empty buffer"
 *
 * @param data
 * @returns {Promise}
 */
function gmToBuffer(data) {
  return new Promise((resolve, reject) => {
    data.stream((err, stdout, stderr) => {
      if (err) {
        return reject(err)
      }
      const chunks = []
      stdout.on('data', chunk => {
        chunks.push(chunk)
      })
      // these are 'once' because they can and do fire multiple times for multiple errors,
      // but this is a promise so you'll have to deal with them one at a time
      stdout.once('end', () => {
        resolve(Buffer.concat(chunks))
      })
      stderr.once('data', data => {
        reject(String(data))
      })
    })
  })
}

const compress = async (img, options = {}) => {
  const { w, format = 'jpeg' } = options

  let gmStream = gm(img).setFormat(format)
  if (w) gmStream = gmStream.resize(w)

  gmStream = gmStream
    .noProfile()
    .sharpen(3, 0.8)
    .compress(format)
  // .toBuffer(format, (err, data) => {
  //   if (err) reject(err)
  //   else imagemin.buffer(data, { plugins }).then(resolve)
  // })
  const buffer = await gmToBuffer(gmStream)
  // console.log(buffer.length)
  return imagemin.buffer(buffer, { plugins })
}

async function generateSet(
  image,
  filename,
  buffer = null,
  callback = () => {}
) {
  image.storage = []
  const [filenameWithoutExt, ext] = filename.split('.'),
    transform = (w, index) =>
      new Promise((resolve, reject) => {
        const newFilename = `${filenameWithoutExt}-${w}w.${ext}`,
          filePath = imageUrl('../uploads/' + newFilename),
          format = (ext => {
            const rs = ext.toLowerCase()
            if (rs === 'jpg') return 'jpeg'
            return rs
          })(ext)

        compress(buffer || imageUrl('../uploads/' + filename), {
          w,
          format
        })
          .then(buf => {
            fs.writeFileSync(filePath, buf)
            // add path to image storage for easier delete
            image.storage.push(filePath)

            if (!image.thumbnails) image.thumbnails = {}
            image.thumbnails[`${w}w`] =
              process.env.APP_HOST + '/uploads/' + newFilename
            // if (process.env.NODE_ENV === 'production')
            //     imagemin.buffer(data, {
            //         plugins: [
            //             ...plugins,
            //             __non_webpack_require__('imagemin-webp')()
            //         ]
            //     }).then(webpBuf => {
            //         fs.writeFileSync(imageUrl(`../uploads/${filenameWithoutExt}-${w}w.webp`), webpBuf);
            //         resolve()
            //     })
            // else
            callback({
              message: `Nén ảnh thành công, chiều rộng ${w}px`,
              percentage: (index + 1) / widths.length
            })
            resolve()
          })
          .catch(err => {
            callback({
              err: true,
              message: `Lỗi khi nén ảnh (thông báo: ${err.message})`
            })
            reject(err)
          })
      })
  try {
    await Promise.all(widths.map(transform))
    // await transform(widths[0])
    await image.save()
  } catch (e) {
    throw e
  }
}

const optimize = async (req, res, next) => {
  const { filename } = req.file
  if (filename.length === 0 || filename === '#') {
    res.json({
      filename,
      url: '#',
      thumbnails: {
        ...zipObject(
          widths.map(w => w + 'w'),
          new Array(widths.length).fill('#')
        )
      }
    })
    return
  }

  const rs = await Image.findOne({
      filename
    })
      .lean(false)
      .exec(),
    image =
      rs ||
      new Image({
        filename,
        url: 'https://server.vaithuhay.com/uploads/' + filename
      })
  try {
    await generateSet(image, filename)
    req.images = image
    next()
  } catch (e) {
    res.status(500).send({ error: e.message })
  }
}

router.post('/', upload.single('img'), optimize, (req, res) => {
  res.json(req.images.toJSON())
})

router.post('/patch', async (req, res) => {
  const { filename } = req.body,
    widths = [80, 150, 300, 400, 600, 1200, 1920]
  if (filename.length === 0 || filename === '#') {
    res.json({
      filename,
      url: '#',
      thumbnails: {
        ...zipObject(
          widths.map(w => w + 'w'),
          new Array(widths.length).fill('#')
        )
      }
    })
    return
  }

  const rs = await Image.findOne({
      filename
    })
      .lean(false)
      .exec(),
    image =
      rs ||
      new Image({
        filename,
        url: 'https://server.vaithuhay.com/uploads/' + filename
      })
  await generateSet(image, filename)
  res.json(image.toJSON())
  // let image = await Image.findOne({
  //   filename
  // }).lean(false).exec();
  //
  // if (image && image.storage === 's3') {
  //   res.json(image.toJSON());
  //   return;
  // }
  //
  // if (!image) image = new Image({
  //   filename,
  //   url: 'https://static.vaithuhay.com/uploads/' + filename
  // });
  // await awsUploader.moveFromLocalToS3(image, filename);
  // res.json(image.toJSON());
})

export default router
export { compress, generateSet, widths, gmToBuffer, gm }
