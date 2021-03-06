import SocketBase from '@server/socket-routes/SocketBase'
import Image from '@server/models/VthImages'
import Image3D from '@server/models/Images3D'
import { generateSet } from '@server/routes/image'
import fs from 'fs'
import path from 'path'
import { bytesToSize } from '@universal/helpers'
import { SOCKET_EV } from '@universal/consts'

class UploadImages extends SocketBase {
  constructor(io, socket) {
    super(io, socket)
    socket.on('uploadImage', this.uploadImage.bind(this))
    socket.on(SOCKET_EV.Image3d.OnUpload, this.uploadSphereImage.bind(this))
    socket.on('fetchImages', this.fetchImages.bind(this))
    socket.on('deleteImage', this.deleteImage.bind(this))
    socket.on('storageStatus', this.storageStatus.bind(this))
  }

  async _createImage(filename) {
    const rs = await Image.findOne({
      filename
    })
      .lean(false)
      .exec()
    return (
      rs ||
      new Image({
        filename,
        host: process.env.APP_HOST,
        url: process.env.APP_HOST + '/uploads/' + filename
      })
    )
  }

  async fetchImages() {
    const images = await Image.find({ host: process.env.APP_HOST })
    this.socket.emit('fetchImagesCompleted', { images })
    this.storageStatus()
  }

  async uploadImage({ uuid, filename, buf }) {
    const { socket } = this,
      imageObj = await this._createImage(filename)

    await generateSet(imageObj, filename, buf, statusObj =>
      socket.emit('uploadImageStatus', {
        uuid,
        ...statusObj
      })
    )
    socket.emit('uploadImageDone', {
      uuid,
      ...imageObj.toJSON()
    })
  }

  async uploadSphereImage({ filename, buf }) {
    const { socket } = this,
      imageSphere = await Image3D.upload(buf, filename, socket)

    socket.emit(SOCKET_EV.Image3d.UploadCompleted, { imageSphere })
  }

  async deleteImage({ uuid, _id }) {
    const image = await Image.findOne({ _id })
    await image.remove()
    this.socket.emit('deleteImageSucceeded', { uuid, _id })
  }

  storageStatus() {
    fs.stat(path.resolve(global.APP_PATH, '../uploads'), (err, stat) => {
      if (err) console.error(err.message)
      console.log('STAT = ' + stat.size)
      this.socket.emit('storageStatusCompleted', {
        totalSize: bytesToSize(stat.size)
      })
    })
  }
}

export default UploadImages
