import SocketBase from '@server/socket-routes/SocketBase'
import HaravanClientApi from '@server/utils/HaravanClientAPI'

class MetafieldsSocketRouter extends SocketBase {
  constructor(io, socket) {
    super(io, socket)
    socket.on('getMetafields', this.getMetafields.bind(this))
    socket.on('deleteMetafield', this.deleteMetafield.bind(this))
  }

  getMetafields() {
    HaravanClientApi.getMetafields(null, null, true).then(metafields => {
      this.socket.emit('getMetafieldsCompleted', metafields)
    })
  }

  deleteMetafield({ resource, id }) {
    // console.log(resource, id)
    HaravanClientApi.deleteMetafield(resource, id).then(() =>
      this.getMetafields()
    )
  }
}

export default MetafieldsSocketRouter
