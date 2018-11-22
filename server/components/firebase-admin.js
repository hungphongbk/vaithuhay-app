import admin from 'firebase-admin'
import serviceAccount from '@server/creds/firebase/website-for-brand-firebase-adminsdk-awzsy-bc565cf321'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://website-for-brand.firebaseio.com'
})

export default admin
