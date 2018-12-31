function bytesToSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0B'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
}

const wm = new Map()
function startMeasureTime() {
  const obj = { sec: 0 },
    handler = setInterval(function() {
      obj.sec += 0.1
    }, 100)
  wm.set(handler, obj)
  return handler
}
function endMeasureTime(handler, callback) {
  const obj = wm.get(handler)
  clearInterval(handler)
  callback(obj.sec)
}

function UploadPathIntoUrl(path) {
  return path.replace(
    /^.*?uploads/,
    (process.env.NODE_ENV === 'development'
      ? 'https://localhost:8089'
      : 'https://server.vaithuhay.com') + '/uploads'
  )
}

export { bytesToSize, startMeasureTime, endMeasureTime, UploadPathIntoUrl }
