var exec = require('ssh-exec'),
  fs = require('fs'),
  host = {
    user: 'root',
    host: '188.166.177.127',
    port: 2234,
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
