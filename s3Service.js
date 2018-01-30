const AWS = require('aws-sdk');
const { accessKeyId, secretAccessKey } = require('./config/awsCredentials.js');

const BUCKET_NAME = 'ultradoujinshi';

AWS.config.update({
  accessKeyId,
  secretAccessKey,
  region: 'sa-east-1'
});

const s3Service = () => {
  const uploadFile = file => new Promise((resolve, reject) =>
    new AWS.S3().putObject(
      { Bucket: BUCKET_NAME, Key: file.name, Body: file.body, ACL: 'public-read' },
      (err, data) => {
        if (!err) {
          console.log(err);
          reject(err);
        } else {
          resolve(data);
        }
      }
    ));

  return {
    uploadFile
  };
};

module.exports = s3Service();
