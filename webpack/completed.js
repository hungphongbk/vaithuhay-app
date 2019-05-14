'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apply = apply;

var _sftpPromises = require('sftp-promises');

var _sftpPromises2 = _interopRequireDefault(_sftpPromises);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _sshExec = require('ssh-exec');

var _sshExec2 = _interopRequireDefault(_sshExec);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var localDir = _path2.default.join(__dirname, '../server/app-build.dev.js'),
    remoteDir = '/home/phong/api.v1/vaithuhay/server/app-build.prod.js',
    sftp = new _sftpPromises2.default();

function apply(compiler) {

  var restart = function restart() {
    var host = {
      user: 'root',
      host: 'hungphongbk.com',
      port: 22,
      key: _fs2.default.readFileSync('/Users/hungphongbk/.ssh/id_rsa'),
      password: 'hungPhong1*!@'
    },
        commands = ['cd /home/phong/api.v1/vaithuhay/', 'cp server/app-build.prod.js server/app.dev.js', 'PORT=8090 forever restart bin/www'];

    (0, _sshExec2.default)(commands.join(';'), host).pipe(process.stdout);
  };

  var connect = void 0;
  sftp.session({
    host: 'hungphongbk.com',
    username: 'root',
    passphrase: 'hungPhong1*!@',
    port: 22,
    privateKey: _fs2.default.readFileSync('/Users/hungphongbk/.ssh/id_rsa')
  }).then(function (session) {
    console.log('connected to hungphongbk server');
    connect = session;
  });
  compiler.plugin('done', function () {
    console.log('Uploading from "' + localDir + '"');
    sftp.put(localDir, remoteDir, connect).then(function () {
      console.log('Uploaded. Restarting server...');
      connect.end();
      restart();
    });
  });
}

//# sourceMappingURL=completed.js.map
