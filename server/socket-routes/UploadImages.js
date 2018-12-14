import SocketBase from '@server/socket-routes/SocketBase'
import Image from '@server/models/VthImages'
import { generateSet } from '@server/routes/image'

class UploadImages extends SocketBase {
  constructor(io, socket) {
    super(io, socket)
    socket.on('uploadImage', this.uploadImage.bind(this))
    socket.on('fetchImages', this.fetchImages.bind(this))
    socket.on('deleteImage', this.deleteImage.bind(this))
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
        host: global.APP_HOST,
        url: global.APP_HOST + '/uploads/' + filename
      })
    )
  }

  async fetchImages({ uuid }) {
    const images = await Image.find({ host: global.APP_HOST })
    this.socket.emit('fetchImagesCompleted', { uuid, images })
  }

  async uploadImage({ uuid, filename, buf }) {
    const { socket } = this,
      imageObj = await this._createImage(filename)
    // console.log(buf.toString().length)
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

  async deleteImage({ uuid, _id }) {
    const image = await Image.findOne({ _id })
    await image.remove()
    this.socket.emit('deleteImageSucceeded', { uuid, _id })
  }
}

export default UploadImages
