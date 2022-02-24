const async = require('async');
const User    = require('../models/User');
const Class   = require('../models/Class');
const Booking = require('../models/Booking');

//Create booking and save it in the database
module.exports = function isLoggedIn(req, res, next) {
  let bookingArrayLength = 0;
  //Find class
  Class.find({_id: req.params.classID}).exec((err, foundClass) => {
    if(err) console.log(err);
    //Does user own the class: Tutor
    if(req.user._id.equals(foundClass[0].author)) {
      let hasBooking = false;
      //Loop through the tutorBooking and find a match of the bookingID
      bookingArrayLength = req.user.tutorBooking.length;
      for(i=0; i<bookingArrayLength; i++) {
        if(req.user.tutorBooking[i] == req.params.bookingID) {
          hasBooking = true;
          return next();
        } else {
          hasBooking = false;
        }
      }
      //If tutor has booking request, then go next
      if(!hasBooking) {
        //If tutor does not have booking request, return false
        req.flash('error', 'The booking request you requested for does not exist.');
        res.redirect('/blackboard/tutor/booking');
      }


    }
    //If User does not own the class: Student
    else {
      let hasBooking = false;
      //Loop through the studentBooking and find a match of the bookingID
      bookingArrayLength = req.user.studentBooking.length;
      for(i=0; i<bookingArrayLength; i++) {
        if(req.user.studentBooking[i] == req.params.bookingID) {
          hasBooking = true;
          return next();
        } else {
          hasBooking = false;
        }
      }
      //If student has booking, then go next
      if(!hasBooking) {
        //If student does not have booking, return false
        req.flash('error', 'You do not have the permission to view the booking you requested. Please book the class to get started.');
        res.redirect('/blackboard/student/booking');
      }
    }
  });
};
