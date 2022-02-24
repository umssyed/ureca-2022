const ClassReview  =  require('../models/ClassReview');
const Class = require('../models/Class');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

///THIS APP DOES NOT THIS CODE ANYMORE

//Verify if the user already has submitted a class review
module.exports = function hasClassReview(req, res, next) {
  console.log('In "hasClassReview" middleware');
  if(req.token) {
    //Verify if user has submitted a class review using the 'authData'
    jwt.verify(req.token, 'secretKay', (err, authData) => {
      if(err) {
        //Forbidden
        res.status(403).json({
          err: err,
          message: 'Error with JWT verification',
          route: 'middleware.hasClassReview',
          location: 'jwt.verify'
        });
      } else {
        //Find the class and its id
        Class.find({slug: req.params.slug}).exec((err, foundClass) => {
          if(err) {
            //Class not found
            res.status(400).json({
              err: err,
              message: 'Error trying to find Class',
              route: 'middleware.hasClassReview',
              location: 'Class Route'
            });
          } else {
            //Find the user using authData
            User.find({slug: authData.user.slug}).exec((err, foundUser) => {
              if(err) {
                //User not found
                res.status(400).json({
                  err: err,
                  message: 'Error trying to find User',
                  route: 'middleware.hasClassReview',
                  location: 'User Route'
                });
              } else {
                //Loop and match the postedClassReview with the Class ID
                let length = foundUser[0].postedClassReview.length;
                for(let i = 0; i < length; i++) {
                  //If there is a match, do not let user post another review
                  if(foundUser[0].postedClassReview[i].equals(foundClass[0]._id)){
                    //Forbidden to submit multiple reviews to the same Class
                    res.status(403).json({
                      message: 'Cannot submit multiple reviews',
                      route: 'middleware.hasClassReview'
                    });
                    return;
                  }
                }
                //User has no reviews - let user post review
                return next();
              }
            });
          }
        });
      }
    });
  } else {
    //Forbidden
    res.status(403).json({
      err: err,
      message: 'No available req.token',
      route: 'middleware.hasClassReview',
      location: 'Forbidden Req.Token'
    });
  }
};
