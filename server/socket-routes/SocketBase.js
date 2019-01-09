import debug from 'debug'

class SocketBase {
  io = null
  socket = null
  channel = null
  static create(io, channel) {
    io.on('connection', socket => new this(io, socket, channel))
  }

  constructor(io, socket, channel) {
    this.io = io
    this.socket = socket
    this.channel = channel

    socket.join(channel)
  }

  emit(eventName, arg) {
    this.socket.emit(eventName, arg)
  }

  emitLog(eventName, arg = null) {
    const log = debug(`socket:${eventName}`),
      fn = arg$1 => {
        log(arg$1)
        this.emit(eventName, arg$1)
      }
    if (arg) fn(arg)
    else return fn
  }
}

export default SocketBase
