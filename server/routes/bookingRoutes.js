const express = require('express');
const router  = express.Router();
const async = require('async');
const User    = require('../models/User');
const Class   = require('../models/Class');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const middleware = require('../middleware/index');
const stripe = require('stripe')('sk_test_fYJejaVi3lB3WVfDv81BBtZO');
const nodemailer = require('nodemailer');
const sendEmail = require('../functions/sendEmail.js');
const moment = require('moment');


//Get Request to book a class
router.get('/book/:id',
middleware.isLoggedIn,
(req, res) => {
  Class.find({_id: req.params.id}).populate([
    {
      path: 'author',
      model: 'User'
    }
  ])
  .exec((err, Class) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    } else {
      res.render('booking/request-booking', {Class: Class, User: req.user});
    }
  });
});

//Post Request to book a class ('/classID/bookingID')
router.post('/book/:id',
middleware.isLoggedIn,
(req, res) => {
  async.waterfall([
    //FUNCTION 1 - Find Class

    function(callback) {
      Class.find({_id: req.params.id}).exec((err, foundClass) => {
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        }
        return callback(null, foundClass);
      });
    },

    //FUNCTION 2 - Find Class Tutor and Student
    function(foundClass, callback) {
      User.find({_id: foundClass[0].author}).exec((err, foundTutor) => {
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        }
        User.find({_id: req.user._id}).exec((err, foundStudent) => {
          if(err) {
            if(req.user) {
              return res.render('404', { User: req.user});
            } else {
              return res.render('404', { User: undefined });
            }
          }
          return callback(null, foundClass, foundTutor, foundStudent);
        });
      });
    },

    //FUNCTION 3 - Create bookClass
    function(foundClass, foundTutor, foundStudent, callback) {
      const bookClass = {
        class: foundClass[0],
        student: req.user,
        tutor: foundTutor[0],
        date: req.body.date,
        hours: req.body.hours,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        totalPrice: req.body.totalPrice
      };
      return callback (null, foundClass, foundTutor, foundStudent, bookClass);
    },

    //FUNCTION 4 - Save bookClass
    function(foundClass, foundTutor, foundStudent, bookClass, callback) {
      Booking.create(bookClass, (err, bookedClass) => {
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        }
        bookedClass.save(function(err) {
          if(err) {
            if(req.user) {
              return res.render('404', { User: req.user});
            } else {
              return res.render('404', { User: undefined });
            }
          }
          return callback (null, foundClass, foundTutor, foundStudent, bookedClass);
        });
      });
    },

    //FUNCTION 5 - Save bookClass to Tutor and Student (find Student)
    function(foundClass, foundTutor, foundStudent, bookedClass, callback) {
      foundTutor[0].tutorBooking.push(bookedClass);
      foundStudent[0].studentBooking.push(bookedClass);
      //Save tutor and student
      foundTutor[0].save(function(err) {
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        } else {
          foundStudent[0].save(function(err) {
            if(err) {
              if(req.user) {
                return res.render('404', { User: req.user});
              } else {
                return res.render('404', { User: undefined });
              }
            } else {
              return callback (null, foundClass, foundTutor, foundStudent, bookedClass);
              // callback (null, bookedClass, 'done');
            }
          });
        }
      });
    },

    //FUNCTION 6 - Create notification
    function(foundClass, foundTutor, foundStudent, bookedClass, callback) {
      const newNotification = {
        item: foundClass[0].classTitle,
        slug: '/book/class/' + bookedClass.class._id + '/bookref/' + bookedClass._id,
        type: 'new_booking',
        author: foundStudent[0]
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
          foundTutor[0].notifications.push(newNotification);
          //Save class author
          foundTutor[0].save(function(err) {
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
                  return callback (null, foundClass, foundTutor, foundStudent, bookedClass);
                  // callback (null, bookedClass, 'done');
                }
              });
            }
          });
        }
      });
    },

    //FUNCTION 7 - Send Email
    function(foundClass, foundTutor, foundStudent, bookedClass, callback) {
      let to = foundTutor[0].username;
      let subject = 'You have a new class booking request!';
      let text = 'Hi ' + foundTutor[0].firstName + ",<br><br>You have a new booking request from " + foundStudent[0].firstName + " " + foundStudent[0].lastName + " for " + bookedClass.class.classTitle + "." + "<br><br>Please log into www.ureca.ca to view the booking.<br>Thank You,<br>Ureca<br><br><b>Please do not reply to this email.</b>";
      sendEmail(to, subject, text);
      callback (null, bookedClass, 'done');
    }

  ], function(err, bookedClass) {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    } else {
      res.redirect('/book/class/' + bookedClass.class._id + '/bookref/' + bookedClass._id);
    }
  });
});

//Get Request to session for messaging
// /class/:classID/bookref/:bookingID
router.get('/book/class/:classID/bookref/:bookingID',
middleware.isLoggedIn,
middleware.bookClass,
(req, res) => {
  req.session.bookingID = req.params.bookingID;
  req.session.classID = req.params.classID;
  Booking.find({_id: req.params.bookingID})
  .populate([
    {
      path: 'student',
      model: 'User'
    },
    {
      path: 'tutor',
      model: 'User'
    },
    {
      path: 'class',
      model: 'Class'
    }
  ])
  .deepPopulate('messages.author')
  .exec((err, booking) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    }

    req.session.class = req.params.classID;
    req.session.price = booking[0].class.price;
    req.session.finalPrice = req.session.price + 3.15;
    res.render('booking/message-booking', {User: req.user, Booking: booking, Tutor: booking[0].tutor, Student: booking[0].student});
  });
});


// Update Timing for booking
// /class/:classID/bookref/:bookingID
router.put('/book/class/:classID/bookref/:bookingID',
middleware.isLoggedIn,
middleware.bookClass,
(req, res) => {
  req.session.bookingID = req.params.bookingID;
  req.session.classID = req.params.classID;
  Booking.find({_id: req.params.bookingID})
  .populate([
    {
      path: 'student',
      model: 'User'
    },
    {
      path: 'tutor',
      model: 'User'
    },
    {
      path: 'class',
      model: 'Class'
    }
  ])
  .deepPopulate('messages.author')
  .exec((err, booking) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    }

    req.session.class = req.params.classID;
    req.session.price = booking[0].class.price;
    req.session.finalPrice = req.session.price + 3.15;

    //New information of booking
    booking[0].date = req.body.date;
    booking[0].hours = req.body.hours;
    booking[0].startTime = req.body.startTime;
    booking[0].endTime = req.body.endTime;
    booking[0].totalPrice = req.body.totalPrice;

    let emailTo;
    let tol; //tutoring or learning
    let tos; //tutor or student

    if(req.user._id.equals(booking[0].student._id)) {
      emailTo = booking[0].tutor;
      tol = 'tutoring';
      tos = 'student';
    } else {
      emailTo = booking[0].student;
      tol = 'learning';
      tos = 'tutor';
    }

    let to = emailTo.username;
    let subject = 'The booking for ' + booking[0].class.classTitle + ' has been updated';
    let text = 'Hi ' + emailTo.firstName + " " + emailTo.lastName + ",<br><br>Your " + tol + " session for " + booking[0].class.classTitle + " has been updated by your " + tos + " " + req.user.firstName + " " + req.user.lastName + "." + "<br><br>Please log into www.ureca.ca to review the changes to the booking.<br>Thank You,<br>Ureca<br><br><b>Please do not reply to this email.</b></b> <span style='opacity: 0'> " + Date.now() + " </span>";
    sendEmail(to, subject, text);

    booking[0].save(function(err) {
      res.redirect('/book/class/' + booking[0].class._id + '/bookref/' + booking[0]._id);
    });
  });
});

// Approve Booking
// /class/:classID/bookref/:bookingID
router.put('/book/class/:classID/bookref/:bookingID/approve',
middleware.isLoggedIn,
middleware.bookClass,
(req, res) => {
  req.session.bookingID = req.params.bookingID;
  req.session.classID = req.params.classID;
  Booking.find({_id: req.params.bookingID})
  .populate([
    {
      path: 'student',
      model: 'User'
    },
    {
      path: 'tutor',
      model: 'User'
    },
    {
      path: 'class',
      model: 'Class'
    }
  ])
  .deepPopulate('messages.author')
  .exec((err, booking) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    }
    req.session.class = req.params.classID;
    req.session.price = booking[0].class.price;
    req.session.finalPrice = req.session.price + 3.15;

    //Find the student and add booking to enrolled classes
    User.find({_id: booking[0].student._id})
    .exec((err, foundStudent) => {
      if(err) {
        if(req.user) {
          return res.render('404', { User: req.user});
        } else {
          return res.render('404', { User: undefined });
        }
      }

      //ENROLLED CLASS AND TUTORLIST
      //This is added here for review purposes

      //If new student and no enrolled classes at all
      if(foundStudent[0].enrolledClasses.length < 1) {
        //Add to enrolled class
        let newClass = {
          enrolledClass: booking[0].class,
          enrolledNumber: 1,
          postedReview: false,
        };
        foundStudent[0].enrolledClasses.push(newClass);
        //Add to tutorList
        let newTutor = {
          tutor: booking[0].tutor,
          postedReview: false
        };
        foundStudent[0].tutorList.push(newTutor);
      }
      else {

        let isClassMatch = false;
        let classMatchIndex = 0;
        //Add class to enrolledClasses, loop through enrolledClasses
        for(let i=0; i<foundStudent[0].enrolledClasses.length; i++) {
          //If class already exists, then increase enrolledNumber
          if(foundStudent[0].enrolledClasses[i].enrolledClass.equals(booking[0].class._id)) {
            isClassMatch = true;
            classMatchIndex = i;
          }
        }

        if(isClassMatch) {
          //if class existed, then use class match index to increase the existing enrolled number
          foundStudent[0].enrolledClasses[classMatchIndex].enrolledNumber++;
        } else {
          //Else add class to enrolledClasses and enrolled Number to 1
          let newClass = {
            enrolledClass: booking[0].class,
            enrolledNumber: 1,
            postedReview: false,
          };
          foundStudent[0].enrolledClasses.push(newClass);
        }

        //Loop through to see if tutor already exists, otherwise add to tutorList
        let isTutorMatch = false;
        for(let i=0; i<foundStudent[0].tutorList.length; i++) {
          //If tutor exists, do nothing, else add to tutor list
          if(booking[0].tutor._id.equals(foundStudent[0].tutorList[i].tutor)) {
            isTutorMatch = true;
          }
        }
        if(!isTutorMatch) {
          let newTutor = {
            tutor: booking[0].tutor,
            postedReview: false
          };
          foundStudent[0].tutorList.push(newTutor);
        }
      }

      //Save Student
      foundStudent[0].save(function(err) {
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        }
      });

      //Save booking
      booking[0].status = 'Approved';
      booking[0].save(function(err) {
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        }

        //Create Notification
        const newNotification = {
          item: booking[0].class.classTitle,
          slug: '/book/class/' + booking[0].class + '/bookref/' + booking[0]._id,
          type: 'booking_approved',
          author: booking[0].tutor,
        };

        Notification.create(newNotification, (err, newNotification) => {
          if(err) {
            if(req.user) {
              return res.render('404', { User: req.user});
            } else {
              return res.render('404', { User: undefined });
            }
          } else {
            //Update for student
            booking[0].student.notifications.push(newNotification);
            //Save student
            booking[0].student.save(function(err) {
              if(err) {
                if(req.user) {
                  return res.render('404', { User: req.user});
                } else {
                  return res.render('404', { User: undefined });
                }
              } else {
                newNotification.save(function(err) {
                  if(err) {
                    if(req.user) {
                      return res.render('404', { User: req.user});
                    } else {
                      return res.render('404', { User: undefined });
                    }
                  } else {
                    let to = foundStudent[0].username;
                    let subject = 'Approved Class Booking';
                    let text = 'Hi ' + foundStudent[0].firstName + ",<br><br>Your class booking for " + booking[0].class.classTitle + " has been approved!" + "<br><br>Please log into www.ureca.ca to view the booking.<br>Thank You,<br>Ureca<br><br><b>Please do not reply to this email.</b> <span style='opacity: 0'> " + Date.now() + " </span>";
                    sendEmail(to, subject, text);

                    res.redirect('/book/class/' + booking[0].class._id + '/bookref/' + booking[0]._id);
                  }
                });
              }
            });
          }
        });
      });
    });
  });
});

router.get('/book/:bookingID/payment', (req, res, next) => {
  res.render('booking/payment', {User: req.user});
});

router.delete('/book/class/:classID/bookref/:bookingID',
middleware.isLoggedIn,
(req, res) => {
  Booking.find({_id: req.params.bookingID})
  .populate([
    {
      path: 'class',
      model: 'Class'
    }
  ]).exec((err, booking) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    }
    if(req.user._id.equals(booking[0].tutor) || req.user._id.equals(booking[0].student)){
      console.log('True');
      async.waterfall([
        //FUNCTION 1 - Find tutor
        function(callback) {
          User.find({_id: booking[0].tutor}).exec((err, tutor) => {
            if(err) {
              if(req.user) {
                return res.render('404', { User: req.user});
              } else {
                return res.render('404', { User: undefined });
              }
            }
            return callback(null, tutor);
          });
        },

        //FUNCTION 2 - Find Student
        function(tutor, callback) {
          User.find({_id: booking[0].student}).exec((err, student) => {
            if(err) {
              if(req.user) {
                return res.render('404', { User: req.user});
              } else {
                return res.render('404', { User: undefined });
              }
            }
            return callback(null, tutor, student);
          });
        },

        //FUNCTION 3 - Delete from tutor
        function(tutor, student, callback) {
          let tutorArray = tutor[0].tutorBooking.length;
          for(i=0; i<tutorArray; i++) {
            if(booking[0]._id.equals(tutor[0].tutorBooking[i])) {
              //Delete the reference
              tutor[0].tutorBooking.splice(i, 1);
              tutor[0].save(function(err) {
                if(err) {
                  if(req.user) {
                    return res.render('404', { User: req.user});
                  } else {
                    return res.render('404', { User: undefined });
                  }
                }
                return callback(null, tutor, student);
              });
            }
          }
        },

        //FUNCTION 4 - Delete from Student
        function(tutor, student, callback) {
          let studentArray = student[0].studentBooking.length;
          for(i=0; i<studentArray; i++) {
            if(booking[0]._id.equals(student[0].studentBooking[i])) {
              //Delete the reference
              student[0].studentBooking.splice(i, 1);
              student[0].save(function(err) {
                if(err) {
                  if(req.user) {
                    return res.render('404', { User: req.user});
                  } else {
                    return res.render('404', { User: undefined });
                  }
                }
                return callback(null, tutor, student);
              });
            }
          }
        },

        //FUNCTION 5 - Delete Messages
        function(tutor, student, callback) {
          console.log(booking[0].messages);
          booking[0].messages = [];
          return callback(null, tutor, student);
        },

        //FUNCTION 5 - Remove Booking and send email
        function(tutor, student, callback) {
          Booking.remove({
            _id: req.params.bookingID
          }, (err) => {
            if(err) {
              if(req.user) {
                return res.render('404', { User: req.user});
              } else {
                return res.render('404', { User: undefined });
              }
            }
            let to1 = tutor[0].username;
            let to2 = student[0].username;
            let bookingDate = moment(booking[0].date).format('dddd, MMM Do YYYY');
            let subject = 'Class booking rejected';
            let text = "Hi, <br><br>The booking for " + booking[0].class.classTitle + " " + "has been rejected." +
            "<br>Tutor: " + tutor[0].firstName + " " + tutor[0].lastName +
            "<br>Student: " + student[0].firstName + " " + student[0].lastName +
            "<br>Booking Date: " + bookingDate +
            "<br>Please log into www.ureca.ca to check your Blackboard.<br>Thank You,<br>Ureca<br><br><b>Please do not reply to this email.</b> <span style='opacity: 0'> " + Date.now() + " </span>";
            sendEmail(to1, subject, text);
            sendEmail(to2, subject, text);
            return callback(null);
          });
        }
      ], function() {
        req.flash('success', 'Booking Rejected.');
        if(req.user._id.equals(booking[0].tutor)){
          res.redirect('/blackboard/tutor/booking');
        }
        if(req.user._id.equals(booking[0].student)){
          res.redirect('/blackboard/student/booking');
        }
      });
    } else {
      req.flash('error', 'You do not have the permission to delete the booking you requested.');
      res.redirect('/blackboard/tutor/booking');
    }
  });
});



//Get all messages (inbox) - NOT USED
router.get('/inbox', (req, res) => {
  Booking.find({tutor: req.user._id})
  .exec((err, foundBooking) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    }
    res.render('user/private/messages/message', {User: req.user, Booking: foundBooking});
  });
});

module.exports = router;
