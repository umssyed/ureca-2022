const express = require('express');
const router  = express.Router();
const async = require('async');
const User    = require('../models/User');
const Class   = require('../models/Class');
const Photo   = require('../models/Photo');
const passport        = require('passport');
const LocalStrategy   = require("passport-local");
const middleware = require('../middleware/index');
// const upload    =  require('../services/amazons3');
const AWSMethod    =  require('../services/amazons3');
const upload = AWSMethod.upload;
const remove = AWSMethod.remove;

//USER ROUTES//
router.get('/users',
(req, res) => {
  User.find().populate([
    {
      path: 'userReviews',
      model: 'UserReview',
    }
  ]).exec((err, user) => {
    res.json(user);
  });
});

//Get individual users profile
router.get('/user/:slug',
(req, res) => {
  //Find and populate the user with user reviews and its authors
  User.find({slug: req.params.slug}).populate([
    {
      path: 'userReviews',
      model: 'UserReview',
      populate: {
        path: 'author',
        model: 'User'
      }
    }
  ]).exec((err, foundUser) => {
    console.log('Enter');
    if(err) {
      if(req.user) {
        res.render('404', { User: req.user});
      } else {
        res.render('404', { User: undefined });
      }
    } else {
      //In case the found User returns an empty object, return user does not exist anymore
      if(foundUser[0] == null || foundUser[0] === undefined) {
        if(req.user) {
          res.render('404', { User: req.user});
        } else {
          res.render('404', { User: undefined });
        }
      } else {
        //Find all the classes associated and owned by the user in question
        Class.find().where("author").equals(foundUser[0]._id).exec((err, userClasses) => {
          if(err) {
            if(req.user) {
              res.render('404', { User: req.user});
            } else {
              res.render('404', { User: undefined });
            }
          } else {
            //Otherwise, send a JSON response with foundUser and userClasses
            //FE should check if userClasses exists and display accordingly
            res.render('user/publicprofile', { User: req.user, Profile: foundUser, UserClass: userClasses });
          }
        });
      }
    }
  });
});

//Render: Edit Profile
router.get('/edit-profile',
middleware.isLoggedIn,
(req, res) => {
  User.findById(req.user._id)
  .populate([
    {
      path: 'photo',
      model: 'Photo'
    }
  ])
  .exec((err, foundUser) => {
    if(err) {
      if(req.user) {
        res.render('404', { User: req.user});
      } else {
        res.render('404', { User: undefined });
      }
    } else {
      res.render('user/private/account/profile-edit', { User: foundUser });
    }
  });
});

//Edit user profile
router.put('/edit-profile',
middleware.isLoggedIn,
(req, res) => {
  User.findOneAndUpdate({_id: req.user._id}, req.body, {new: true})
  .exec((err, updatedUser) => {
    if(err) {
      if(req.user) {
        res.render('404', { User: req.user});
      } else {
        res.render('404', { User: undefined });
      }
      res.status(400).send(err);
    } else {
      updatedUser.save((err) => {
        if(err) {console.log(err)};
        res.render('user/private/account/profile-edit', { User: updatedUser });
      });
    }
  });
});


//Render: Upload Photo
router.get('/upload-photo',
middleware.isLoggedIn,
(req, res) => {
  User.findById(req.user._id)
  .exec((err, foundUser) => {
    if(err) {
      if(req.user) {
        res.render('404', { User: req.user});
      } else {
        res.render('404', { User: undefined });
      }
    } else {
      res.render('user/private/account/upload-photo', { User: foundUser });
    }
  });
});

//Upload Photo
router.post('/upload-photo',
middleware.isLoggedIn,
upload.any(),
function(req, res, next) {
  User.findOneAndUpdate({_id: req.user._id}, req.body, {new: true})
  .exec((err, updatedUser) => {
    if(err) {
      if(req.user) {
        res.render('404', { User: req.user});
      } else {
        res.render('404', { User: undefined });
      }
      res.status(400).send(err);
    } else {

      updatedUser.profilePhoto = req.files[0].location;
      updatedUser.save((err) => {
        if(err) {
          if(req.user) {
            res.render('404', { User: req.user});
          } else {
            res.render('404', { User: undefined });
          }
        };
        res.redirect('/upload-photo');
      });
    }
  });
});

router.post('/upload-photo/delete',
middleware.isLoggedIn,
function(req, res, next) {
  User.findOne({_id: req.user._id})
  .exec((err, updatedUser) => {
    if(err) {
      if(req.user) {
        res.render('404', { User: req.user});
      } else {
        res.render('404', { User: undefined });
      }
    } else {
      async.waterfall([
        function(callback) {

          remove(updatedUser._id, updatedUser);


          return callback(null);
        }
      ], function() {
        setTimeout(function () {
          res.redirect('/upload-photo');
        }, 2500);

      });
    }
  });
});

//Render: Tutor Edit Profile
//ADD LOGIC TO CHECK IF TUTOR IS TRUE
router.get('/edit-tutor',
middleware.isLoggedIn,
(req, res) => {
  User.findById(req.user._id)
  .populate([
    {
      path: 'photo',
      model: 'Photo'
    }
  ])
  .exec((err, foundUser) => {
    if(err) {
      if(req.user) {
        res.render('404', { User: req.user});
      } else {
        res.render('404', { User: undefined });
      };
    } else {
      console.log(foundUser);
      if(foundUser.isTutor) {
        res.render('user/private/account/tutor-edit', { User: foundUser });
      } else {
        req.flash('error', 'You need to become a tutor to edit your tutor profile. Start by creating a class.');
        res.redirect('/edit-profile');
      }
    }
  });
});

//Edit Tutor profile
router.put('/edit-tutor',
middleware.isLoggedIn,
(req, res) => {
  User.findOneAndUpdate({_id: req.user._id}, req.body, {new: true})
  .exec((err, updatedUser) => {
    if(err) {
      if(req.user) {
        res.render('404', { User: req.user});
      } else {
        res.render('404', { User: undefined });
      }
      res.status(400).send(err);
    } else {
      updatedUser.save((err) => {
        if(err) {console.log(err)};
        res.render('user/private/account/tutor-edit', { User: updatedUser });
      });
    }
  });
});

//Get Image  (AJAX)
router.get('/profile-image', (req, res) => {
  User.find({_id: req.user._id})
  .populate([
    {
      path: 'photo',
      model: 'Photo'
    }
  ]).exec((err, foundUser) => {
    if(err) {
      if(req.user) {
        res.render('404', { User: req.user});
      } else {
        res.render('404', { User: undefined });
      }
    }
    res.json(foundUser[0].photo.imageURL)
  });
});

module.exports = router;
