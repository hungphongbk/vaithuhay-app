import admin from 'firebase-admin'
import serviceAccount from '@server/jobs/hungphongbk-956498bd8112.json'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hungphongbk-1812.firebaseio.com"
});

export default admin;
