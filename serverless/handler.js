'use strict';

const exec = require('child_process').exec;
const crypto = require('crypto');
const fs = require('fs');
const AWS = require('aws-sdk');

module.exports.screenshot = (event, context, callback) => {
  console.log(event);
  const targetUrl = event.url;

  var place = event.place;
  var d = new Date;
  var day = [d.getFullYear(), d.getMonth()+1, d.getDate()].join('-');
  var time = [d.getHours(), d.getMinutes(), d.getSeconds()].join('-');

  const targetBucket = `traffic-maps`;
  const targetHash = crypto.createHash('md5').update(targetUrl).digest('hex');
  const targetFilename = `screenshot/${place}/${day}/${time}.png`;

  console.log(`Snapshotting ${targetUrl} to s3://${targetBucket}/${targetFilename}`);

  const cmd = `./phantomjs/phantomjs --debug=yes --ignore-ssl-errors=true ./phantomjs/screenshot.js "${targetUrl}" /tmp/${targetHash}.png`;

  exec(cmd, (error, stdout, stderr) => {
    console.log(`error: ${error}`);
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);

    if (error) {
      // the command failed (non-zero), fail the entire call
      console.warn(`exec error: ${error}`, stdout, stderr);
      callback(`422, please try again ${error}`);
    }
    else {
      console.log(`Reading file from tmp: /tmp/${targetHash}.png`);

      // snapshotting succeeded, let's upload to S3
      const fileBuffer = fs.readFileSync(`/tmp/${targetHash}.png`);

      // upload the file
      const s3 = new AWS.S3();

      s3.putObject({
          ACL: 'public-read',
          Key: targetFilename,
          Body: fileBuffer,
          Bucket: targetBucket,
          ContentType: 'image/png',
        }, (err) => {
          if (err) {
            console.warn(err);
            callback(err);
          } else {
            callback(null, {
              hash: targetHash,
              key: `${targetFilename}`,
              bucket: targetBucket,
            });
          }
          return;
      });
    }

  });
};
