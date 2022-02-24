const AWS = require('aws-sdk');
var express = require('express');
var multer = require('multer');
var multerS3 = require('multer-s3');
const User    = require('../models/User');
const Photo   = require('../models/Photo');

//Set AWS S3 Region
AWS.config.update({region: 'ca-central-1'});

//Load configuration
AWS.config.loadFromPath('./server/config/awsconfig.json');

AWS.config.update({
  signatureVersion: 'v4'
});

var s3 = new AWS.S3({});
var upload = multer({

  storage: multerS3({
    s3: s3,
    bucket: 'ureca-profile',
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      //By saving the key as user._id, image is automatically overwritten in AWS to the users unique key.
      //Therefore no duplicate should exist
      cb(null, req.user._id + '.jpg')
    }
  })
});


var remove = function(userID, user) {
  var params = {
    Bucket: 'ureca-profile',
    Delete: {
      Objects: [
        {Key: userID + '.jpg'}
      ]
    }
  };
  s3.deleteObjects(params, function(err, data) {
    if(err) {
      console.log(err);
    } else {
      user.profilePhoto = '/assets/icons/profileDefault.png';
      user.save(function(err) {
        if(err) {
          console.log(err);
        }
      })
    }

  });

};
//
// { Deleted: [ { Key: '5c18731e4ab0295320f8a377.jpg' } ],
//   Errors: [] }



module.exports = {
  upload: upload,
  remove: remove
}
