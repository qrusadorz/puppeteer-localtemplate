const { db, storage } = require('./firebaseAdmin');
const { config } = require('../configs/config');

const bucket = storage.bucket();

const { itemsFilename } = config;

const updateItems = async (items) => {
    // await db.collection("items").doc("latest").update(items);
    await db.collection("items").doc("latest").set(items);
}

const uploadItems = async () => await uploadFile(itemsFilename);

const uploadFile = async (filename) => {
    // Uploads a local file to the bucket
    const response = await bucket.upload(filename, {
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        gzip: true,
        private: false,
        public: true,
        metadata: {
        // Enable long-lived HTTP caching headers
        // Use only if the contents of the file will never change
        // (If the contents will change, use cacheControl: 'no-cache')
        // cacheControl: 'public, max-age=31536000', // 1year
            // cacheControl: 'public, max-age=86400',  // 1day
            cacheControl: 'public, max-age=3600',  // 1hour
        },
    });

    // // console.log("response:", response);
    // const { metadata } = response[0];
    // // console.log("metadata:", metadata);
    // const { etag } = metadata;
    // console.log("etag:", etag);
    // const res = await bucket.file(filename).setMetadata({ "If-Match": etag });
    // console.log("res:", res);
    // const [metadata2] = await bucket.file(filename).getMetadata();
    // console.log("metadata2:", metadata2);


    // const [metadata] = await bucket.file(filename).getMetadata();
  
    // console.log(`File: ${metadata.name}`);
    // console.log(`Bucket: ${metadata.bucket}`);
    // console.log(`Storage class: ${metadata.storageClass}`);
    // console.log(`Self link: ${metadata.selfLink}`);
    // console.log(`ID: ${metadata.id}`);
    // console.log(`Size: ${metadata.size}`);
    // console.log(`Updated: ${metadata.updated}`);
    // console.log(`Generation: ${metadata.generation}`);
    // console.log(`Metageneration: ${metadata.metageneration}`);
    // console.log(`Etag: ${metadata.etag}`);
    // console.log(`Owner: ${metadata.owner}`);
    // console.log(`Component count: ${metadata.component_count}`);
    // console.log(`Crc32c: ${metadata.crc32c}`);
    // console.log(`md5Hash: ${metadata.md5Hash}`);
    // console.log(`Cache-control: ${metadata.cacheControl}`);
    // console.log(`Content-type: ${metadata.contentType}`);
    // console.log(`Content-disposition: ${metadata.contentDisposition}`);
    // console.log(`Content-encoding: ${metadata.contentEncoding}`);
    // console.log(`Content-language: ${metadata.contentLanguage}`);
    // console.log(`Media link: ${metadata.mediaLink}`);
    // console.log(`KMS Key Name: ${metadata.kmsKeyName}`);
    // console.log(`Temporary Hold: ${metadata.temporaryHold}`);
    // console.log(`Event-based hold: ${metadata.eventBasedHold}`);
    // console.log(`Effective Expiration Time: ${metadata.effectiveExpirationTime}`);
    // console.log(`Metadata: ${metadata.metadata}`);
}

module.exports = { updateItems, uploadItems, uploadFile };

const setCors = async (bucket) => {
    await bucket.setMetadata({
        "cors": [
            {
                "maxAgeSeconds": "3600",
                "method": [
                   "GET",
                   "HEAD",
                ],
                "origin": [
                    config.url,
                    "http://localhost:3000",
                    "http://localhost:5000",
                ],
                "responseHeader":[
                  "Content-Type",
                //   "If-None-Match",
                //   "If-Match",
                //   "if-match",
               ],
          }
        ]
    });
    console.log("", (await bucket.get())[0].metadata.cors);
}

const setPublic = async (bucket, filename) => {
    await bucket.file(filename).makePublic();
}
