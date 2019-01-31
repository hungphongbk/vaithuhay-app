const path = require('path'),
  os = require('os'),
  NodeSSH = require('node-ssh')

function getFilePath(relativePath) {
  return path.resolve(os.homedir(), relativePath)
}

const defaultSshOpts = { cwd: '/home/phong/api.v1/vaithuhay' }

module.exports = {
  apply(compiler) {
    const ssh = new NodeSSH(),
      config = {
        host: '188.166.177.127',
        port: '2234',
        user: 'root',
        privateKey: getFilePath('.ssh/id_rsa')
      },
      connectPromise = ssh.connect(config)

    compiler.plugin('done', function(stat, callback) {
      connectPromise
        .then(() =>
          ssh
            .putDirectory(
              path.resolve(__dirname, '../server-dist/'),
              '/home/phong/api.v1/vaithuhay/server-dist',
              {
                recursive: true,
                concurrency: 7,
                tick(localPath, _, err) {
                  if (err) {
                    console.error(err.message)
                    console.error(localPath)
                  } else console.info(`${localPath} successfully uploaded!`)
                }
              }
            )
            .then(() => console.log('All files has been successfully uploaded'))
        )
        .then(() =>
          ssh
            .execCommand(
              'redis-cli flushall; pm2 restart vaithuhay --interpreter=`which node`',
              defaultSshOpts
            )
            .then(() => console.log('Server has been successfully restarted'))
        )
        .then(() => {
          // ssh.destroy()
          callback()
        })
    })
  }
}
