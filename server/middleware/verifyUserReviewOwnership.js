const UserReview  = require('../models/UserReview');
const jwt      = require('jsonwebtoken');

//THIS APP DOES NOT USE THIS CODE ANYMORE 

// Verify if user owns the user review
module.exports = function verifyUserReviewOwnership(req, res, next) {
  UserReview.find({_id: req.params.reviewsID}, (err, foundReview) => {
    if(err) {
      //If error occurs
      console.log('step 4');
      res.status(400).send(err);
    } else {
      console.log('step 5');
      if(foundReview[0] != undefined) {
        //Verify that the user owns this review by comparing the author id with authData user id from headers
        console.log(foundReview[0]);
        console.log(req.user);
        if(foundReview[0].author == req.user._id) {
          //User owns review - go next
          return next();
        } else {
          //Forbidden
          res.status(403).send({
            message: 'FORBIDDEN: User does not own this content'
          });
        }
      } else {
        //Forbidden
        res.status(404).send({
          message: 'Content does not exist'
        });
      }
    }
  });
};
