const admin = require('firebase-admin');
const { config } = require('../configs/config');

const serviceAccount = require('../configs/serviceaccount.json');
// const serviceAccount = require('../configs/serviceaccount_dev.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: config.storageBucket,
});

const db = admin.firestore();
const storage = admin.storage();

module.exports = { db, storage };
