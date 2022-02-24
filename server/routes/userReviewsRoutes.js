const express     = require('express');
const router      = express.Router();
const async       = require('async');
const User        = require('../models/User');
const UserReview  = require('../models/UserReview');
const Notification = require('../models/Notification');
const middleware = require('../middleware/index');
const jwt      = require('jsonwebtoken');
const addRating = require('../functions/ratings/user/addRating');
const deleteRating = require('../functions/ratings/user/deleteRating');
const deletePostedReview = require('../functions/ratings/user/deletePostedReview');


//**This should be restricted to tutors at the beginning**
//---------- REVIEWS FOR USERS ----------//
//Render: Class review form
router.get('/user/:slug/reviews',
(req, res) => {
  User.find({slug: req.params.slug}).exec((err, foundUser) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    } else {
      res.render('user/private/new-user-review', { User: req.user, Profile: foundUser });
    }
  });
});

//REVIEWS FOR USER//
//Post review to a particular user
router.post('/user/:slug/reviews',
(req, res) => {
  //Run async code
  async.waterfall([
    //FUNCTION 1 - Find the End User who is getting reviewed
    function(callback) {
      User.find({slug: req.params.slug}).exec((err, endUser) => {
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        } else {
          return callback (null, endUser);
        }
      });
    },

    //FUNCTION 2 - Find the mainUser who is posting the review
    function(endUser, callback) {
      User.find({slug: req.user.slug}).exec((err, mainUser) => {
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        } else {
          //Update tutorList
          let tutorMatchIndex = 0;
          for(let i=0; i<mainUser[0].tutorList.length; i++) {
            if(mainUser[0].tutorList[i].tutor.equals(endUser[0]._id)) {
              tutorMatchIndex = i;
            }
          }
          //Has the user already posted a review before
          if(!mainUser[0].tutorList[tutorMatchIndex].postedReview) {
            //If not true, then allow to post
            mainUser[0].tutorList[tutorMatchIndex].postedReview = true;
            return callback (null, endUser, mainUser);
          } else {
            //If user already has a review posted, return with error
            req.flash('error', 'You have already submitted a review previously. Thank you.');
            res.redirect('/blackboard/tutor-reviews');
          }
        }
      });
    },

    //FUNCTION 3 - Create User Reviews
    function(endUser, mainUser, callback) {
      UserReview.create(req.body, (err, reviews) => {
        //Handle error
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        } else if(!req.user) {
          //If in case user is not logged in, throw an error
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        } else {
          //Update reviews field and save
          reviews.author = req.user;
          reviews.tutor = endUser[0];
          reviews.save(function(err) {
            if(err) {
              if(req.user) {
                return res.render('404', { User: req.user});
              } else {
                return res.render('404', { User: undefined });
              }
            } else {
              return callback (null, endUser, mainUser, reviews);
            }
          });
        }
      });
    },

    //FUNCTION 4 - Update information in endUser
    function(endUser, mainUser, reviews, callback) {
      //Add rating to the end User and push the reviews to the endUser model
      addRating(endUser[0], reviews);
      //Push the new ratings to the star rating array and save the Class to the db
      endUser[0].userReviews.push(reviews);
      //Add the endUser id to the mainUser's postedUser Review to track user reviews
      mainUser[0].postedUserReview.push(reviews._id);
      return callback (null, endUser, mainUser);
    },

    //FUNCTION 5 - Create notification for endUser and push to endUser
    function(endUser, mainUser, callback) {
      //Create an object of new notificatoin that needs to be stored to the db
      const newNotification = {
        type: 'new_user_review',
        author: req.user
      };
      Notification.create(newNotification, (err, newNotification) => {
        if(err) {
          //Notification could not be created
          res.status(400).json({
            message: 'Error creating notification'
          });
        } else {
          //Save notification
          newNotification.save(function(err) {
            if(err) {
              res.status(400).json({
                err: err,
                message: 'Error saving notification',
                route: 'router.post("/users/:slug/reviews")',
                location: 'newNotification.save()'
              });
            } else {
              //Push the notification to end user
              endUser[0].notifications.push(newNotification);
              return callback (null, endUser, mainUser);
            }
          });
        }
      });
    },

    //FUNCTION 6 - Save User Models
    function(endUser, mainUser, callback) {
      endUser[0].save(function(err) {
        if(err) {
          res.status(400).json({
            err: err,
            message: 'Error saving end User getting user reviews',
            route: 'router.post("/users/:slug/reviews")',
            location: 'endUser[0].save()'
          });
        } else {
          mainUser[0].save(function(err) {
            if(err) {
              res.status(400).json({
                err: err,
                message: 'Error saving main User posting reviews',
                route: 'router.post("/users/:slug/reviews")',
                location: 'mainUser[0].save()'
              });
            } else {
              return callback(null);
            }
          });
        }
      });
    },

  ], function() {
    req.flash('success', 'Review successfully posted.');
    res.redirect('/blackboard/tutor-reviews');
  });
});

//Updating reviews to a particular user
router.put('/user/:slug/reviews/:reviewsID',
 (req, res) => {

  //Run async code
  async.waterfall([
    //FUNCTION 1 - Find the endUser that is getting reviewed
    function(callback) {
      User.find({slug: req.params.slug}).exec((err, endUser) => {
        if(err) {
          res.status(400).json({
            err: err,
            message: 'Error finding endUser',
            route: 'router.put("/users/:slug/reviews/:reviewsID")',
            location: 'User.find()'
          });
        } else {
          return callback (null, endUser);
        }
      });
    },

    //FUNCTION 2 - Create User review
    function(endUser, callback) {
      UserReview.findOneAndUpdate({_id: req.params.reviewsID}, req.body, {new: true})
      .exec((err, updatedReviews) => {
        if(err) {
          res.status(400).json({
            err: err,
            message: 'Error finding and updating User Review',
            route: 'router.put("/users/:slug/reviews/:reviewsID")',
            location: 'UserReview.findOneAndUpdate()'
          });
        } else {
          return callback (null, endUser, updatedReviews);
        }
      });
    },

    //FUNCTION 3 - Update and save endUser
    function(endUser, updatedReviews, callback) {
      addRating(endUser[0], updatedReviews);
      endUser[0].save(function(err) {
        if(err) {
          res.status(400).json({
            err: err,
            message: 'Error saving endUser when updating reviews',
            route: 'router.put("/users/:slug/reviews/:reviewsID")',
            location: 'endUser[0].save()'
          });
        } else {
          return callback (null);
        }
      });
    },

  ], function() {
    //Success
    res.status(200).json({
      message: 'User review successfully updated',
      route: 'router.put(/users/:slug/reviews/:reviewsID)',
    });
  });
});

//Deleting reviews to a particular user
router.delete('/users/:slug/reviews/:reviewsID',
 (req, res) => {
   jwt.verify(req.token, 'secretKay', (err, authData) => {
     if(err) {
       res.status(403).json({
         err: err,
         message: 'Error with JWT verification',
         route: 'router.post("/users/:slug/reviews")',
         location: 'jwt.verify'
       })
     } else {

       //Run async code
       async.waterfall([
         //FUNCTION 1 - Find endUser
         function(callback) {
           User.find({slug: req.params.slug}).exec((err, endUser) => {
             if(err) {
               res.status(400).json({
                 err: err,
                 message: 'Error trying to find User that has the reviews',
                 route: 'router.delete("/users/:slug/reviews")',
                 location: 'User.find()'
               });
             } else {
               return callback (null, endUser);
             }
           });
         },

         //FUNCTION 2 - Find mainUser
         function(endUser, callback) {
           User.find({slug: authData.user.slug}).exec((err, mainUser) => {
             if(err) {
               res.status(400).json({
                 err: err,
                 message: 'Error trying to find User that has posted reviews',
                 route: 'router.delete("/users/:slug/reviews")',
                 location: 'User.find()'
               });
             } else {
               return callback (null, endUser, mainUser);
             }
           });
         },

         //FUNCTION 3 - Find the Class Reviews
         function(endUser, mainUser, callback) {
           UserReview.find({_id: req.params.reviewsID})
           .exec((err, reviews) => {
             if(err) {
               res.status(400).json({
                 err: err,
                 message: 'Error trying to find user review',
                 route: 'router.delete("/users/:slug/reviews")',
                 location: 'UserReview.find()'
               });
             } else {
               return callback (null, endUser, mainUser, reviews);
             }
           });
         },

         //FUNCTION 4 - Update endUser and mainUser
         function(endUser, mainUser, reviews, callback) {
           deleteRating(endUser[0], reviews);
           deletePostedReview(mainUser[0], reviews);
           return callback (null, endUser, mainUser, reviews);
         },

         //FUNCTION 5 - Delete User Review, remove and save User Models
         function(endUser, mainUser, reviews, callback) {
           //Find the User Review that needs to be removed
           UserReview.findByIdAndRemove(req.params.reviewsID, (err) => {
             if(err) {
               res.status(400).json({
                 err: err,
                 message: 'Error trying to find delete user review',
                 route: 'router.delete("/users/:slug/reviews/:reviewsID")',
                 location: 'UserReview.findByIdAndRemove()'
               });
             } else {
               return callback (null, endUser, mainUser);
             }
           });
         },

         function(endUser, mainUser, callback) {
           endUser[0].save(function(err) {
             if(err) {
               res.status(400).json({
                 err: err,
                 message: 'Error saving endUser when deleting reviews',
                 route: 'router.delete("/users/:slug/reviews/:reviewsID")',
                 location: 'endUser[0].save()'
               });
             } else {
               mainUser[0].save(function(err) {
                 if(err) {
                   res.status(400).json({
                     err: err,
                     message: 'Error saving endUser when deleting reviews',
                     route: 'router.delete("/users/:slug/reviews/:reviewsID")',
                     location: ' mainUser[0].save()'
                   });
                 } else {
                   return callback(null);
                 }
               });
             }
           });
         },

       ], function() {
         //Success
         res.status(200).json({
           message: 'User review successfully deleted',
           route: 'router.delete(/users/:slug/reviews)',
         });
       });
     }
   });
 });

module.exports = router;
