const ClassReview   = require('../models/ClassReview');
const jwt      = require('jsonwebtoken');

//THIS APP DOES NOT USE THIS ANYMORE

//Verify if user owns the class review
module.exports = function verifyClassReviewOwnership(req, res, next) {
  console.log('In "verifyClassReviewOwnership" middleware');
  if(req.token) {
    //Verify class review ownership using the 'authData' from headers
    jwt.verify(req.token, 'secretKay', (err, authData) => {
      if(err) {
        //Forbidden
        res.status(403).json({
          err: err,
          message: 'Error with JWT verification',
          route: 'middleware.verfifyClassReviewOwnership',
          location: 'jwt.verify'
        });
      } else {
        //Find the class by looking at the slug in the req.params
        ClassReview.find({_id: req.params.reviewsID}, (err, foundReview) => {
          if(err) {
            //Class review not found
            res.status(400).json({
              err: err,
              message: 'Error trying to find Class Review',
              route: 'middleware.verfifyClassReviewOwnership',
              location: 'ClassReview.find()'
            });
          } else {
            if(foundReview[0] != undefined) {
              //Verify that the user owns this review by comparing the author id with authData user id from headers
              if(foundReview[0].author.equals(authData.user._id)){
                console.log('success JWT');
                //Attach authData in res.locals
                res.locals.authData = authData;
                //User owns review - go next
                return next();
              } else {
                //Forbidden
                res.status(403).json({
                  message: 'Forbidden: User does not own this content',
                  route: 'middleware.verfifyClassReviewOwnership',
                });
              }
            } else {
              //Forbidden
              res.status(404).json({
                message: 'Content does not exist',
                route: 'middleware.verfifyClassReviewOwnership'
              });
            }
          }
        });
      }
    });
  } else {
    //Forbidden
    res.status(403).json({
      err: err,
      message: 'No available req.token',
      route: 'middleware.verfifyClassReviewOwnership',
      location: 'Forbidden Req.Token'
    });
  }
};
