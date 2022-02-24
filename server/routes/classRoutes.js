const express = require('express');
const router  = express.Router();
const async = require('async');
const User    = require('../models/User');
const Class   = require('../models/Class');
const Notification = require('../models/Notification');
const middleware = require('../middleware/index');

//CLASS ROUTES//
//PUBLIC ROUTES//
//Get all available classes from the DB
router.get('/allclasses',
(req, res) => {
  Class.find().populate([
    {
      path: 'author',
      model: 'User',
      populate: {
        path: 'photo',
        model: 'Photo'
      }
    },
    {
      path: 'classReviews',
      model: 'ClassReview',
    }
  ]).exec((err, Class) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    } else {
      res.status(200);
      console.log(req.user);
      res.render('class/allclasses', { User: req.user, Class: Class });
    }
  });
});


//Show an individual class from an ID
//Populate the author and reviews for this individual class
router.get('/allclasses/:slug',
(req, res) => {
  Class.find({slug: req.params.slug}).populate([
    {
      path: 'author',
      model: 'User'
    },
    {
      path: 'classReviews',
      model: 'ClassReview',
      populate: {
        path: 'author',
        model: 'User'
      }
    }
  ]).exec((err, foundClass) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    } else {

      if(foundClass == null || foundClass[0] === undefined || foundClass == []){
        if(req.user) {
          return res.render('404', { User: req.user});
        } else {
          return res.render('404', { User: undefined });
        }
      }
      res.render('class/classpage', { User: req.user, Class: foundClass });
    }
  })
});


module.exports = router;
