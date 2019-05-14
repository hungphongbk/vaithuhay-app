import tunnel from 'tunnel-ssh'
import fs from 'fs'

const devSSHTunnel = cb => {
  const sshConfig = {
    host: '139.162.32.127',
    username: 'root',
    agent: process.env.SSH_AUTH_SOCK,
    privateKey: fs.readFileSync(process.env.DEV_SSH_PRIVATE_KEY, 'utf-8'),
    port: 22,
    dstPort: 27017
  }

  tunnel(sshConfig, (err, server) => {
    if (err) {
      console.error(err.message)
      return
    }
    console.log('SSH connection successfully')
    cb()
  })
}

export default devSSHTunnel
