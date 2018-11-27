import SocketBase from '@server/socket-routes/SocketBase'

class UploadImages extends SocketBase {
  constructor(io, socket) {
    super(io, socket)
    socket.on('upload image', this.uploadImage.bind(this))
  }

  uploadImage(data) {}
}

export default UploadImages
