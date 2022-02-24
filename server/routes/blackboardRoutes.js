const express = require('express');
const router  = express.Router();
const async = require('async');
const User    = require('../models/User');
const Class   = require('../models/Class');
const Notification = require('../models/Notification');
const middleware = require('../middleware/index');
const stripe = require('stripe')('sk_test_fYJejaVi3lB3WVfDv81BBtZO');
const nodemailer = require('nodemailer');
const moment = require('moment');

//BLACKBOARD ROUTES//
//PRIVATE ROUTES//

//Display Blackboard Overview
//Displays the overview page. Shows 'to-dos' for the user
router.get('/',
middleware.isLoggedIn,
(req, res) => {
  User.findById({_id: req.user._id})
  .populate([
    {
      path: 'notifications',
      model: 'Notification',
      populate: {
        path: 'author',
        model: 'User',
      }
    }
  ]).exec((err, foundUser) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    }
      res.render('user/private/blackboard/overview', { User: foundUser });
  });
});

//Display Tutor Section
//Show all available classes that tutor is teaching
//Allows tutor to manage classes from here
router.get('/tutor',
middleware.isLoggedIn,
(req, res) => {
  Class.find({author: req.user._id})
  .exec((err, myClasses) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    } else {
      res.status(200);
      res.render('user/private/blackboard/tutor', { User: req.user, Class: myClasses });
    }
  });
});

//Display requested bookings to tutor
router.get('/tutor/booking',
middleware.isLoggedIn,
(req, res) => {
  User.findById({_id: req.user._id})
  .populate([
    {
      path: 'notifications',
      model: 'Notification'
    },
    {
      path: 'tutorBooking',
      model: 'Booking',
      match: {status: 'Pending'},
      populate: [{
        path: 'class',
        model: 'Class'
      },
      {
        path: 'student',
        model: 'User'
      }
      ]
    }
  ]).exec((err, foundUser) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    }
      res.render('user/private/blackboard/tutor-booking', { User: foundUser });
  });
});

//Display scheduled classes for tutor
router.get('/tutor/scheduled',
middleware.isLoggedIn,
(req, res) => {
  User.findById({_id: req.user._id})
  .populate([
    {
      path: 'notifications',
      model: 'Notification'
    },
    {
      path: 'tutorBooking',
      model: 'Booking',
      match: {status: 'Approved'},
      populate: [{
        path: 'class',
        model: 'Class'
      },
      {
        path: 'student',
        model: 'User'
      }
      ]
    }
  ]).exec((err, foundUser) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    }
     // DELETE
    if(moment(foundUser.tutorBooking[0].date)) {
      let day = moment(foundUser.tutorBooking[0].date).add(20, 'days').format('LLL');
      console.log(day);
    }
    res.render('user/private/blackboard/tutor-scheduled', { User: foundUser });
  });
});

//Render: Post new class
router.get('/tutor/new',
middleware.isLoggedIn,
(req, res) => {
  res.render('class/private/new-class', { User: req.user });
});

//Post new class
router.post('/tutor/new',
middleware.isLoggedIn,
(req, res) => {
  //Create an object of new class that needs to be stored to the db
  const newClass = {
    id: req.body.id,
    classTitle: req.body.classTitle,
    classDescription: req.body.classDescription,
    mainSubject: req.body.mainSubject,
    educationLevel: req.body.educationLevel,
    prereq: req.body.prereq,
    learningOutcome: req.body.learningOutcome,
    materialsProvided: req.body.materialsProvided,
    topics: req.body.topics,
    institute: req.body.institute,
    courseCode: req.body.courseCode,
    classType: req.body.classType,
    price: req.body.price,
    author: req.user,
    city: req.user.city,
    province: req.user.province,
    country: req.user.country,
    updatedAt: Date.now()
  };

  async.waterfall([

    //FUNCTION 1 - Create the class
    function(callback) {
      Class.create(newClass, (err, newClass) => {
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        } else {
          return callback (null, newClass);
        }
      });
    },

    //FUNCTION 2 - Create notification
    function(newClass, callback) {
      //Create an object of new notificatoin that needs to be stored to the db
      const newNotification = {
        item: newClass.classTitle,
        type: 'new_class',
      };
      Notification.create(newNotification, (err, newNotification) => {
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        } else {
          return callback(null, newClass, newNotification);
        }
      });
    },

    //FUNCTION 3 - Find User and update
    function(newClass, newNotification, callback) {
      User.findOne({_id: req.user._id}).exec((err, foundUser) => {
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        } else {
          //Update the isTutor field to be true for the user
          foundUser.isTutor = true;
          //Push notification to the notification array of user
          foundUser.notifications.push(newNotification);
          //Save the user to the database
          foundUser.save(function(err) {
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
    },
  ], function(result) {
    req.flash('success', 'Your class has been successfully created. You can manage all your classes from your Blackboard.' );
    res.redirect('/blackboard/tutor');
  });
});

//Render: Edit class
router.get('/tutor/:id/edit',
middleware.isLoggedIn,
middleware.verifyClassOwnership,
(req, res) => {
  Class.findOne({_id: req.params.id}).exec((err, classToUpdate) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    } else {
      res.render('class/private/class-edit', { User: req.user, Class: classToUpdate });
    }
  });
});

//Update a tutor owned class
router.put('/tutor/:id',
middleware.isLoggedIn,
middleware.verifyClassOwnership,
(req, res) => {
  Class.findOneAndUpdate({_id: req.params.id}, req.body, {new: true})
  .exec((err, updatedClass) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    } else {
      //Update the updatedAt field
      updatedClass.updatedAt = Date.now();
      //Save the Class
      updatedClass.save((err) => {
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        };
        Class.find({author: req.user._id})
        .exec((err, myClasses) => {
          if(err) {
            if(req.user) {
              return res.render('404', { User: req.user});
            } else {
              return res.render('404', { User: undefined });
            }
          } else {
            req.flash('success', 'Your class  has been updated.' );
            res.redirect('/blackboard/tutor');
          }
        });
      });
    }
  });
});

//Render: Delete class
router.get('/tutor/:id/delete',
middleware.isLoggedIn,
middleware.verifyClassOwnership,
(req, res) => {
  Class.findOne({_id: req.params.id}).exec((err, classToDelete) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    } else {
      res.render('class/private/class-delete', { User: req.user, Class: classToDelete });
    }
  });
});

//Delete a tutor owned class
router.delete('/tutor/:id',
middleware.isLoggedIn,
middleware.verifyClassOwnership,
 (req, res) => {
    Class.remove({
      _id: req.params.id
    }, (err) => {
      if(err) {
        if(req.user) {
          return res.render('404', { User: req.user});
        } else {
          return res.render('404', { User: undefined });
        }
      } else {
        //Before sending a JSON respone, find the User
        //Check if user has any other classes and tweak isTutor accordingly
        User.findOne({_id: req.user._id}).exec((err, foundUser) => {
          //if error, return error
          if(err) {
            if(req.user) {
              return res.render('404', { User: req.user});
            } else {
              return res.render('404', { User: undefined });
            }
          } else {
            //Check to see how many classes is owned by the User
            Class.find().where('author').equals(foundUser._id).exec((err, userClasses) => {
              //if error, return error
              if(err) {
                if(req.user) {
                  return res.render('404', { User: req.user});
                } else {
                  return res.render('404', { User: undefined });
                }
              } else {
                //Check to see if user's classes do not exist
                if(userClasses.length < 1) {
                  //assign isTutor to false
                  foundUser.isTutor = false;
                  foundUser.save();
                }
                //JSON the response
                // res.status(200);
                req.flash('success', 'Your class has been deleted.' );
                res.redirect('/blackboard/tutor');
              }
            });
          }
        });
      }
    });
});


//Display Student Section
//Display Upcoming classes
router.get('/student',
middleware.isLoggedIn,
(req, res) => {
  User.findById({_id: req.user._id})
  .populate([
    {
      path: 'notifications',
      model: 'Notification'
    },
    {
      path: 'studentBooking',
      model: 'Booking',
      match: {status: 'Approved'},
      populate: [{
        path: 'class',
        model: 'Class'
      },
      {
        path: 'tutor',
        model: 'User'
      }
      ]
    }
  ]).exec((err, foundUser) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    }
    res.render('user/private/blackboard/student', { User: foundUser });
  });
});

//Display bookings for students
router.get('/student/booking',
middleware.isLoggedIn,
(req, res) => {
  User.findById({_id: req.user._id})
  .populate([
    {
      path: 'notifications',
      model: 'Notification'
    },
    {
      path: 'studentBooking',
      model: 'Booking',
      match: {status: 'Pending'},
      populate: [{
        path: 'class',
        model: 'Class'
      },
      {
        path: 'tutor',
        model: 'User'
      }
      ]
    }
  ]).exec((err, foundUser) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    }
    res.render('user/private/blackboard/student-booking', { User: foundUser });
  });
});

//======= TUTOR REVIEWS ===================================================//
//Render: Available and Posted User Reviews
// Available tutor reviews
router.get('/tutor-reviews',
middleware.isLoggedIn,
(req, res) => {
  User.find({_id: req.user._id})
  .deepPopulate('tutorList.tutor')
  .exec((err, foundUser) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    }
    //Check to see if there are posted tutor reviews
    let availableTutorReviews = [];

    //If user has already posted previous reviews, search through those reviews
    if(foundUser[0].tutorList.length > 0) {
      for(let i=0; i<foundUser[0].tutorList.length; i++) {
        if(!foundUser[0].tutorList[i].postedReview) {
          availableTutorReviews.push(foundUser[0].tutorList[i].tutor);
        }
      }
    }
    res.render('user/private/blackboard/reviews-tutor', { User: foundUser[0], availableReviews: availableTutorReviews });
  })
});

// Posted tutor reviews
router.get('/tutor-reviews-posted',
middleware.isLoggedIn,
(req, res) => {
  User.find({_id: req.user._id})
  .populate([
    {
      path: 'enrolledClasses',
      model: 'Class',
      populate: [{
        path: 'author',
        model: 'User'
      }]
    },
    {
      path: 'postedUserReview',
      model: 'UserReview',
      populate: [{
        path: 'tutor',
        model: 'User'
      }]
    }
  ]).exec((err, foundUser) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    }
    let postedUserReviews = foundUser[0].postedUserReview;

    res.render('user/private/blackboard/reviews-posted-tutor', { User: foundUser[0], postedUserReviews: postedUserReviews });
  })
});

//======= CLASS REVIEWS =======//
//Render: Available and Posted Class Reviews
// Available class reviews
router.get('/class-reviews',
middleware.isLoggedIn,
(req, res) => {
  User.find({_id: req.user._id})
  .populate([
    {
      path: 'enrolledClasses',
      model: 'Class',
      populate: [{
        path: 'author',
        model: 'User'
      }]
    }
  ])
  .deepPopulate('enrolledClasses.enrolledClass')
  .exec((err, foundUser) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    }
    //Check to see if there are posted tutor reviews
    let availableClassReviews = [];
    //If user has already posted a class review, search through those reviews
    if(foundUser[0].enrolledClasses.length > 0) {
      for(let i=0; i<foundUser[0].enrolledClasses.length; i++) {
        //THIS IS WHERE TO ADD NUMBER 3 FOR REVIEWS
        if(!foundUser[0].enrolledClasses[i].postedReview) {
          availableClassReviews.push(foundUser[0].enrolledClasses[i].enrolledClass);
        }
      }
    }
    res.render('user/private/blackboard/reviews-class', { User: foundUser[0], availableReviews: availableClassReviews });
  })
});

// Posted reviews on class
router.get('/class-reviews-posted',
middleware.isLoggedIn,
(req, res) => {
  User.find({_id: req.user._id})
  .populate([
    {
      path: 'postedClassReview',
      model: 'ClassReview',
      populate: {
        path: 'classID',
        model: 'Class'
      }
    }
  ])
  .exec((err, foundUser) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    }
    let postedClassReview = foundUser[0].postedClassReview;
    res.render('user/private/blackboard/reviews-posted-class', { User: foundUser[0], postedClassReview: postedClassReview });
  })
});

// Notifications Page From Overview -> Notifcations
router.get('/notifications',
middleware.isLoggedIn,
(req, res) => {
  User.findById({_id: req.user._id})
  .populate([
    {
      path: 'notifications',
      model: 'Notification',
      populate: {
        path: 'author',
        model: 'User',
      }
    }
  ]).exec((err, foundUser) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    }
    res.render('user/private/blackboard/notifications', { User: foundUser });
  });
});

module.exports = router;
