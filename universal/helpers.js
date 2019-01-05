function bytesToSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0B'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
}

function randomHash() {
  return (
    Math.random()
      .toString(36)
      .substring(2, 15) +
    Math.random()
      .toString(36)
      .substring(2, 15)
  )
}

const wm = new Map()
function startMeasureTime() {
  const handler = randomHash()
  wm.set(handler, Date.now())
  return handler
}
function endMeasureTime(handler, callback) {
  const before = wm.get(handler),
    diff = Date.now() - before
  callback(diff / 1000)
}

function UploadPathIntoUrl(path) {
  return path.replace(/^.*?uploads/, process.env.APP_HOST + '/uploads')
}

const _obj = { logOnce: false }
function logOnce(arg) {
  if (!_obj.logOnce) {
    _obj.logOnce = true
    console.log(arg)
  }
}

export {
  bytesToSize,
  startMeasureTime,
  endMeasureTime,
  UploadPathIntoUrl,
  logOnce,
  randomHash
}
