import PromiseSftp from 'sftp-promises'
import path from 'path'
import exec from 'ssh-exec'
import fs from 'fs'

const localDir = path.join(__dirname, '../server/app-build.dev.js'),
  remoteDir = '/home/phong/api.v1/vaithuhay/server/app-build.prod.js',
  sftp = new PromiseSftp();

export function apply(compiler) {

  const restart = () => {
    const host = {
        user: 'root',
        host: 'hungphongbk.com',
        port: 22,
        key: fs.readFileSync('/Users/hungphongbk/.ssh/id_rsa'),
        password: 'hungPhong1*!@'
      },
      commands = [
        'cd /home/phong/api.v1/vaithuhay/',
        'cp server/app-build.prod.js server/app.dev.js',
        'PORT=8090 forever restart bin/www'
      ];

    exec(commands.join(';'), host)
      .pipe(process.stdout)
  };

  let connect;
  sftp.session({
    host: 'hungphongbk.com',
    username: 'root',
    passphrase: 'hungPhong1*!@',
    port: 22,
    privateKey: fs.readFileSync('/Users/hungphongbk/.ssh/id_rsa')
  }).then(session => {
    console.log('connected to hungphongbk server')
    connect = session;
  });
  compiler.plugin('done', function () {
    console.log(`Uploading from "${localDir}"`);
    sftp.put(localDir, remoteDir, connect)
      .then(() => {
        console.log(`Uploaded. Restarting server...`);
        connect.end()
        restart();
      });
  })
}
