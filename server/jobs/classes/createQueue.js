import kue from 'kue'

const createQueue = (prefix = 'q', redis = {}) => {
  const queue = kue.createQueue({ prefix, redis })

  queue
    .on('job enqueue', function(id, type) {
      // process.env.NODE_ENV === 'development' &&
      //   console.log('Job %s got queued of type %s', id, type)
    })
    .on('job complete', function(id, result) {
      kue.Job.get(id, function(err, job) {
        if (err) return
        job.remove(function(err) {
          if (err) throw err
          // console.log('removed completed job #%d', job.id)
        })
      })
    })

  return queue
}

export default createQueue
