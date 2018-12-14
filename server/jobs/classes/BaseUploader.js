import path from 'path'
import gm$ from 'gm'
import imagemin from 'imagemin'
import jpegtran from 'imagemin-jpegtran'
import pngquant from 'imagemin-pngquant'

export default class BaseUploader {
  widthSet: Array<number>
  rootPath: String

  constructor(options = { widthSet: [], rootPath: '' }) {
    Object.assign(this, options)
    this.gm = gm$.subClass({ imageMagick: true })
    this.plugins = [
      jpegtran({ progressive: true }),
      pngquant({ quality: '65-80' })
    ]
  }

  imageUrl(url: String): String {
    return path.join(this.rootPath, url)
  }

  _compress(filename: String, width: Number, format: String): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.gm(this.imageUrl(filename))
        .resize(width)
        .noProfile()
        .sharpen(3, 0.8)
        .compress(format)
        .toBuffer(format, (err, data) => {
          if (err) {
            console.log('error when resizing image to ' + width + 'w')
            reject(err)
          } else {
            imagemin
              .buffer(data, {
                plugins: this.plugins
              })
              .then(buf => resolve(buf))
          }
        })
    })
  }

  async generateSet(image, filename: String) {
    const [filenameWithoutExt, ext] = filename.split('.')

    const transform = (w: Number) =>
      new Promise((resolve, reject) => {
        const newFilename = `${filenameWithoutExt}-${w}w.${ext}`,
          filePath = this.imageUrl(newFilename),
          format = (ext => {
            const rs = ext.toLowerCase()
            if (rs === 'jpg') return 'jpeg'
            return rs
          })(ext)

        this._compress(filename, w, format)
          .then(buf => {})
          .catch(err => reject(err))
      })
  }

  upload(filename: String, buf: Buffer): Promise<any> {}
}
