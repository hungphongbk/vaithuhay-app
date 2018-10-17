import http from 'http';
import https from 'https';
import fs from 'fs';
import socketIO from 'socket.io';
import requestStats from 'request-stats';
import {FirebaseAdmin} from "@server/components";
import omit from 'lodash/omit';

const dev = process.env.NODE_ENV === 'development',
  port = global.APP_PORT;

export default function (app) {
  //firebase db ref to 'requestLogging/[dev/prod]'
  const dbRef = FirebaseAdmin.database().ref('server');

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

  requestStats(server, requestInfo => {
    const env = dev ? 'dev' : 'prod';
    if (requestInfo.req.method.toLowerCase() === 'options') return Promise.resolve();

    const obj = omit(requestInfo, ['req.raw', 'res.raw']);
    obj.timestamp = Date.now();

    return dbRef.child(`requestLogging/${env}`).push()
      .set(obj, err => {
        if (err)
          console.error(err);
      });
  });

  server.listen(port);

  return {server, io};
}
