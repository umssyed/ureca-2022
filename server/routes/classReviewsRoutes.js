const express = require('express');
const router  = express.Router();
const async = require('async');
const User    = require('../models/User');
const Class   = require('../models/Class');
const ClassReview   = require('../models/ClassReview');
const Notification = require('../models/Notification');
const middleware = require('../middleware/index');
const addRating = require('../functions/ratings/addRating');
const deleteRating = require('../functions/ratings/deleteRating');
const deleteClassReviews = require('../functions/users/deleteClassReviews');

//---------- REVIEWS FOR CLASSES ----------//
//Render: Class review form
router.get('/allclasses/:id/reviews',
middleware.isLoggedIn,
(req, res) => {
  Class.find({_id: req.params.id}).exec((err, foundClass) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    } else {
      res.render('class/private/new-class-review', { User: req.user, Class: foundClass });
    }
  });
});

//POST CLASS REVIEWS
router.post('/allclasses/:id/reviews',
(req, res) => {
    //Run async code
    async.waterfall([
      //FUNCTION 1 - Find the class
      function(callback) {
        Class.find({_id: req.params.id}).exec((err, foundClass) => {
          //If there is error in trying to find the class, throw error
          if(err) {
            if(req.user) {
              return res.render('404', { User: req.user});
            } else {
              return res.render('404', { User: undefined });
            };
          } else {
            return callback (null, foundClass);
          }
        });
      },

      //FUNCTION 2 - Create Class Reviews
      function(foundClass, callback) {
        ClassReview.create(req.body, (err, reviews) => {
          //Handle error
          if(err) {
            if(req.user) {
              return res.render('404', { User: req.user});
            } else {
              return res.render('404', { User: undefined });
            }
          }
          else {
            //Update reviews field and save
            reviews.classID = foundClass[0]._id;
            reviews.author = req.user;
            reviews.save(function(err) {
              if(err) {
                if(req.user) {
                  return res.render('404', { User: req.user});
                } else {
                  return res.render('404', { User: undefined });
                }
              } else {
                return callback (null, foundClass, reviews);
              }
            });
          }
        });
      },

      //FUNCTION 3 - Find User
      function(foundClass, reviews, callback) {
        User.find({_id: req.user._id})
        .exec((err, foundUser) => {
          if(err) {
            if(req.user) {
              return res.render('404', { User: req.user});
            } else {
              return res.render('404', { User: undefined });
            }
          } else {
            //Update user fields
            foundUser[0].postedClassReview.push(foundClass[0]._id);
            //Update enrolledClasses
            let classMatchIndex = 0;
            for(let i=0; i<foundUser[0].enrolledClasses.length; i++) {
              if(foundClass[0]._id.equals(foundUser[0].enrolledClasses[i].enrolledClass)) {
                classMatchIndex = i;
              }
            }
            //Has the user already posted a review before
            if(!foundUser[0].enrolledClasses[classMatchIndex].postedReview) {
              //If not true, then allow to post
              foundUser[0].enrolledClasses[classMatchIndex].postedReview = true;
              return callback (null, foundClass, reviews, foundUser);
            } else {
              //If user already has a review posted, return with error
              req.flash('error', 'You have already submitted a review previously for this class. Thank you.');
              res.redirect('/blackboard/class-reviews');
            }
          }
        });
      },

      //FUNCTION 4 - Update information in User and Class Models and Save
      function(foundClass, reviews, foundUser, callback) {
        addRating(foundClass[0], reviews);
        foundClass[0].save(function(err) {
          if(err) {
            if(req.user) {
              return res.render('404', { User: req.user});
            } else {
              return res.render('404', { User: undefined });
            }
          } else {
            //Add the endUser id to the mainUser's postedUser Review to track user reviews
            foundUser[0].postedClassReview.push(reviews._id);
            foundUser[0].save(function(err) {
              if(err) {
                if(req.user) {
                  return res.render('404', { User: req.user});
                } else {
                  return res.render('404', { User: undefined });
                }
              } else {
                return callback (null, foundClass, foundUser);
              }
            });
          }
        });
      },

      //FUNCTION 5 - Find Class Author
      function(foundClass, foundUser, callback) {
        User.find({_id: foundClass[0].author})
        .exec((err, classAuthor) => {
          if(err) {
            if(req.user) {
              return res.render('404', { User: req.user});
            } else {
              return res.render('404', { User: undefined });
            }
          } else {
            return callback (null, foundClass, foundUser, classAuthor);
          }
        });
      },

      //FUNCTION 6 - Create/save notification for Class author and push/save
      function(foundClass, foundUser, classAuthor, callback) {
        //Create an object of new notificatoin that needs to be stored to the db
        const newNotification = {
          item: foundClass[0].classTitle,
          slug: foundClass[0].slug,
          type: 'new_class_review',
          author: req.user
        };
        Notification.create(newNotification, (err, newNotification) => {
          if(err) {
            if(req.user) {
              return res.render('404', { User: req.user});
            } else {
              return res.render('404', { User: undefined });
            }
          } else {
            //Update notification for class author
            classAuthor[0].notifications.push(newNotification);
            //Save class author
            classAuthor[0].save(function(err) {
              if(err) {
                if(req.user) {
                  return res.render('404', { User: req.user});
                } else {
                  return res.render('404', { User: undefined });
                }
              } else {
                //Save notification
                newNotification.save(function(err) {
                  if(err) {
                    if(req.user) {
                      return res.render('404', { User: req.user});
                    } else {
                      return res.render('404', { User: undefined });
                    }
                  } else {
                    return callback(null);
                  }
                });
              }
            });
          }
        });
      },

    ], function() {
      req.flash('success', 'Review successfully posted.');
      res.redirect('/blackboard/class-reviews');
    });
});

//UPDATING A CLASS REVIEWS
router.put('/allclasses/:slug/reviews/:reviewsID',
 middleware.verifyClassReviewOwnership,
 (req, res) => {
  console.log('Inside Post Class Reviews');
  ClassReview.findOneAndUpdate({_id: req.params.reviewsID}, req.body, {new: true})
  .exec((err, updatedReviews) => {
    if(err) {
      res.status(400).json({
        err: err,
        message: 'Error finding and updating Class Review',
        route: 'router.put("/allclasses/:slug/reviews/:reviewsID")',
        location: 'ClassReview.findOneAndUpdate()'
      });
    } else {
      res.status(200).json(updatedReviews);
    }
  });
});

//DELETING A CLASS REVIEWS
router.delete('/allclasses/:class_slug/reviews/:reviewsID',
(req, res) => {
  console.log('Inside Delete Class Reviews');
  let authData = res.locals.authData;
  //Run async code
  async.waterfall([

    //FUNCTION 1 - Find Class Review
    function(callback) {
      ClassReview.find({_id: req.params.reviewsID}).exec((err, reviews) => {
        console.log('function 1');
        if(err) {
          res.status(400).json({
            err: err,
            message: 'Error trying to find Class Review',
            route: 'router.delete("/allclasses/:class_slug/reviews/:reviewsID")',
            location: 'Class Review Route'
          });
        } else {
          return callback (null, reviews);
        }
      });
    },

    //FUNCTION 2 - Find Class
    function(reviews, callback) {
      Class.find({slug: req.params.class_slug}).exec((err, foundClass) => {
        console.log('function 2');
        if(err) {
          res.status(400).json({
            err: err,
            message: 'Error trying to find Class',
            route: 'router.delete("/allclasses/:class_slug/reviews/:reviewsID")',
            location: 'Class Route'
          });
        } else {
          if(foundClass.length < 1) {
            res.status(404).json({
              message: 'Error trying to find Class',
              route: 'router.delete("/allclasses/:class_slug/reviews/:reviewsID")',
              location: 'Class Route'
            });
          }
          return callback (null, reviews, foundClass);
        }
      });
    },

    //FUNCTION 3 - Check if slugs and ids match
    function(reviews, foundClass, callback) {
      console.log('function 3');
      if(foundClass[0]._id.equals(reviews[0].classID)) {
        callback (null, reviews, foundClass);
      } else {
        res.status(404).json({
          message: 'Content not found',
          route: 'router.post(/allclasses/:class_slug/reviews/:reviewsID)',
          location: 'User.find()'
        });
      }
    },

    //FUNCTION 4 - Update the ratings and class reviews in the Class model
    function(reviews, foundClass, callback) {
      console.log('function 4');
      deleteRating(foundClass, reviews);
      foundClass[0].save(function(err) {
        if(err) {
          //Bad Request
          res.status(400).json({
            err: err,
            message: 'Error trying to save Class',
            route: 'router.delete("/allclasses/:class_slug/reviews/:reviewsID")',
            location: 'foundClass[0].save()'
          });
        } else {
          callback (null, reviews, foundClass);
        }
      });
    },

    //FUNCTION 5 - Find the User and delete the classID from postedClassReview
    function(reviews, foundClass, callback) {
      User.find({slug: authData.user.slug}).exec((err, foundUser) => {
        console.log('function 5');
        if(err) {
          //NEED TO HANDLE THIS
          res.status(400).send(err);
        } else {
          deleteClassReviews(foundUser, foundClass);
          foundUser[0].save(function(err) {
            if(err) {
              //Bad Request
              res.status(400).json({
                err: err,
                message: 'Error saving user',
                route: 'router.post(/allclasses/:class_slug/reviews/:reviewsID)',
                location: 'foundUser[0].save()'
              });
            } else {
              callback (null, reviews);
            }
          });
        }
      });
    },

    //FUNCTION 6 - Find the class review and delete
    function(reviews, callback) {
      ClassReview.remove({_id: req.params.reviewsID}, function(err) {
        console.log('function 6');
        if(err) {
          res.status(400).send(err);
        } else {
          return callback(null);
        }
      });
    }
  ], function(result) {
    //Success
    res.status(200).json({
      message: 'Class review successfully deleted',
      route: 'router.post(/allclasses/:class_slug/reviews/:reviewsID)',
    });
  });
});



module.exports = router;
