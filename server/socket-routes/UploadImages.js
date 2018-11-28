import SocketBase from '@server/socket-routes/SocketBase'
import Image from '@server/models/Images'
import { generateSet } from '@server/routes/image'

class UploadImages extends SocketBase {
  constructor(io, socket) {
    super(io, socket)
    socket.on('uploadImage', this.uploadImage.bind(this))
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
        url: 'https://server.vaithuhay.com/uploads/' + filename
      })
    )
  }

  async uploadImage({ uuid, filename, buf }) {
    const { socket } = this,
      imageObj = await this._createImage(filename)
    console.log(buf.toString().length)
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
}

export default UploadImages
