import http from 'http'
import https from 'https'
import fs from 'fs'
import socketIO from 'socket.io'

const dev = process.env.NODE_ENV === 'development',
  port = global.APP_PORT;

export default function (app) {
  global.APP_INSTANCE = app;
  app.set('port', port);
  console.log('SERVER port = ' + port);

  function createDev() {
    console.log('SERVER will be initialized on development mode');
    const key = fs.readFileSync('/etc/pki/tls/certs/MyOwnGrave.key'),
      cert = fs.readFileSync('/etc/pki/tls/certs/MyOwnGrave.crt'),
      credentials = {key, cert};
    return https.createServer(credentials, app);
  }

  function createProd() {
    return http.createServer(app);
  }

  const server = dev ? createDev() : createProd(),
    io = socketIO(server, (dev ? {} : {
      resource: '/vaithuhay/b/socket.io'
    }));
  server.listen(port);

  return {server, io};
}
