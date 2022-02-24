const express = require('express');
const router  = express.Router();
const async       = require('async');
const User        = require('../models/User');
const Notification = require('../models/Notification');
const middleware = require('../middleware/index');

//AJAX all notifications
router.get('/api/:id/notifications',
middleware.isLoggedIn,
(req, res) => {
  User.find({_id: req.user._id})
  .populate([
    {
      path: 'notifications',
      model: 'Notification'
    }
  ])
  .exec((err, user) => {
    if(err) {console.log(err);}
    res.json(user[0].notifications);
  });
});


//View all notifications
router.get('/user/:slug/notifications',
middleware.isLoggedIn,
(req, res) => {
  if(req.user.slug === req.params.slug) {
    User.find({slug: req.params.slug})
    .populate([
      {
        path: 'notifications',
        model: 'Notification'
      }
    ])
    .exec((err, foundUser) => {
      if(err) {
        if(req.user) {
          return res.render('404', { User: req.user});
        } else {
          return res.render('404', { User: undefined });
        }
      } else {
        res.render('user/private/account/notifications', { User: foundUser });
      }
    });
  } else {
    //Forbidden
    res.status(403).json({
      err: err,
      message: 'User does not have permissions',
      route: 'router.get("users/:slug/bb/notifications")',
      location: 'Illegal URL'
    });
  }
});

//Delete all notifications
router.delete('/notifications',
middleware.isLoggedIn,
(req, res) => {
   if(req.user._id) {

     //Run async code
     async.waterfall([
       //Find User
       function(callback) {
         User.find({_id: req.user._id})
         .exec((err, foundUser) => {
           if(err) {
             if(req.user) {
               return res.render('404', { User: req.user});
             } else {
               return res.render('404', { User: undefined });
             }
           } else {
             return callback (null, foundUser);
           }
         });
       },

       //Find all notifications and remove from all models
       function(foundUser, callback) {
         let length = foundUser[0].notifications.length;
         for(let i = 0; i < length; i++) {
           Notification.findByIdAndRemove(foundUser[0].notifications[i])
           .exec((err, notifications) => {
             if(err) {
               if(req.user) {
                 return res.render('404', { User: req.user});
               } else {
                 return res.render('404', { User: undefined });
               }
             }
           });
         }
         foundUser[0].notifications.splice(0, length);
         foundUser[0].save(function(err) {
           if(err) {
             if(req.user) {
               return res.render('404', { User: req.user});
             } else {
               return res.render('404', { User: undefined });
             }
           } else {
             return callback(null)
           }
         });
       },

     ], function() {
       //Success
      res.redirect('/blackboard/notifications');
     });
   } else {
     //Forbidden
     res.status(403).json({
       err: err,
       message: 'User does not have permissions',
       route: 'router.delete("users/:slug/bb/notifications")',
       location: 'Illegal URL'
     });
   }
});

module.exports = router;
