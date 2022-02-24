const express  = require('express');
const router   = express.Router();
const passport = require('passport');
const LocalStrategy   = require("passport-local");
const User     = require('../models/User');
const middleware = require('../middleware/index');
const async = require('async');
const config     = require('../../server/config/configKeys');
var nodemailer = require("nodemailer");
var crypto = require("crypto");

//PASSPORT ROUTES//

//Local Strategy
//Render Signup page
router.get('/signup', (req, res) => {
  res.render('authentication/signup');
});

//Signup a new user
router.post('/signup', (req, res) => {
  let newUser = new User(
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username, //username is email
        city: req.body.city,
        province: req.body.province,
        country: req.body.country,
        isTutor: false,
        profilePhoto: '/assets/icons/profileDefault.png'
      });
    User.register(newUser, req.body.password, function(err, user){
      if(err){
        if(err.message === 'A user with the given username is already registered') {
          req.flash('error', 'A user with the given email is already registered.');
          return res.redirect('signup');
        } else {
          req.flash('error', err.message);
          console.log('WE HAVE AN ERROR SIGNING UP: ', err.message)
          console.log('User entered:', newUser.city, newUser.province, newUser.country)
          return res.redirect('signup');
        }
      } else {
        passport.authenticate("local")(req, res, function(){
          req.flash('success', 'Hello ' + user.firstName + ' ' + user.lastName + '. Welcome to Ureca!');
          res.redirect("/blackboard");
        });
      }
    });
});

//Render Login page
router.get('/login', (req, res) => {
  if(req.user) {
    res.redirect('/allclasses');
  } else {
    res.render('authentication/login');
  }
});

//Login User
router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/blackboard',
    failureRedirect: '/auth/login',
    failureFlash: true,
  }), (req, res) => {

  }
);

//Google O-Auth20
router.get('/signin/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

router.get(
  '/signin/google/callback',
  passport.authenticate('google'),
  (req, res) => {
    res.redirect('/');
  }
);

//return current logged-in user
router.get('/user_data',
(req, res) => {
  var user = '';
  if(req.user === undefined) {
    user = undefined;
    res.json({
      user: user
    });
  } else {
    user = req.user
    res.json({
      user: user
    });
  }
});

//logout user
router.get('/logout',
(req, res) => {
  req.logout();
  req.flash('success', 'Thank you for using Ureca!');
  res.redirect('/');
});

//Forgot password
router.get('/forgot',
(req, res) => {
  if(req.user) {
    res.redirect('/allclasses');
  } else {
    res.render('authentication/forgot', {User: undefined});
  }
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ username: req.body.username }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/auth/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: config.emailUser,
          pass: config.emailPass
        }
      });
      var mailOptions = {
        to: req.body.username,
        from: 'Ureca <uzair@ureca.com>',
        subject: 'Ureca - Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/auth/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n' +
          "Thank You,\nUreca\n\nPlease do not reply to this email."
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + req.body.username + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/auth/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/auth/forgot');
    }
    res.render('authentication/reset', {token: req.params.token, User: undefined});
  });
});

router.post('/reset/:token', function(req, res) {
  console.log('1');
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        console.log('USER: ', user);
        if(req.body.password === req.body.confirm) {
          console.log('PASSWORD EQUAL');
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: config.emailUser,
          pass: config.emailPass
        }
      });
      var mailOptions = {
        to: user.username,
        from: 'Ureca <uzair@ureca.com>',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.username + ' has just been changed.\n' +
          "Thank You,\nUreca\n\nPlease do not reply to this email."
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/auth/login');
  });
});


module.exports = router;
