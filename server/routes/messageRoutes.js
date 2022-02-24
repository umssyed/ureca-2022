const express = require('express');
const router  = express.Router();
const async = require('async');
const User    = require('../models/User');
const Class   = require('../models/Class');
const Notification = require('../models/Notification');
const middleware = require('../middleware/index');

//Display Messages
router.get('/',
middleware.isLoggedIn,
(req, res) => {
  User.findById({_id: req.user._id})
  .populate([
    {
      path: 'notifications',
      model: 'Notification'
    }
  ]).exec((err, foundUser) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    }
      res.render('user/private/messages/message', { User: foundUser });
  });
});

module.exports = router;
