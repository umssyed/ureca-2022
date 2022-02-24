const User = require('../models/User');
const Booking = require('../models/Booking');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');
const sendEmail = require('../functions/sendEmail.js');
const async = require('async');

module.exports = function(io) {
  io.on('connection', function(socket) {
    var user = socket.request.user;
    var bookingID = socket.request.session.bookingID;
    var classID = socket.request.session.classID;

    socket.join(bookingID);
    socket.on('chatTo', (data) => {
      async.waterfall([
        function(callback) {
          io.in(bookingID).emit('incomingChat', {
            date: Date.now(),
            senderID: user._id,
            message: data.message,
            sender: user.firstName,
            photo: user.profilePhoto,
          });
          //Create message and save
          var message = new Message();
          message.author = user._id;
          message.content = data.message;
          message.photo = user.profilePhoto
          message.save(function(err) {
            callback(err, message, data);
          });

        },

        function(message, data, callback) {
          //Save booking object and push message
          Booking.update(
            {
              _id: bookingID
            }, {
              $push: { messages: message._id }
            }, function(err, count) {
              callback(err, message, data);
            }
          );
        },

        function(message, data, callback) {
          //Find Booking information to create notification
          Booking.find({_id: bookingID})
          .exec((err, booking) => {
            if(err) {
              if(req.user) {
                return res.render('404', { User: req.user});
              } else {
                return res.render('404', { User: undefined });
              }
            }

            //Trying to find WHO to send notification to from booking information
            var who;
            if(user._id.equals(booking[0].student)) {
              who = booking[0].tutor;
            } else {
              who = booking[0].student;
            }
            //Find Who
            User.find({_id: who})
            .exec((err, foundWho) => {
              if(err) {
                if(req.user) {
                  return res.render('404', { User: req.user});
                } else {
                  return res.render('404', { User: undefined });
                }
              }

              //Create notification
              const newNotification = {
                item: booking[0],
                slug: '/book/class/' + classID + '/bookref/' + bookingID,
                type: 'new_message',
                author: user
              };

              Notification.create(newNotification, (err, newNotification) => {
                if(err) {
                  if(req.user) {
                    return res.render('404', { User: req.user});
                  } else {
                    return res.render('404', { User: undefined });
                  }
                } else {
                  //Update notification for foundWho
                  foundWho[0].notifications.push(newNotification);
                  //Save foundWho User
                  foundWho[0].save(function(err) {
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
                          //Send Email
                          let to = data.emailTo;
                          let subject = user.firstName + ' ' + user.lastName + ' sent you a new message';
                          let text = 'Hi ' + data.emailToName + ",<br><br>You have a new message from your " + data.designation + " " + user.firstName + " " + user.lastName + ":" + "<br><br>" + "<b>'" + message.content + "'</b>" + "<br><br>" + "<a href='http://ureca.ca/book/class/" + classID + "/bookref/"+ bookingID + "'>Click here</a>" +  " to reply to the message.<br>Thank You,<br>Ureca<br><br><b>Please do not reply to this email.</b> <span style='opacity: 0'> " + Date.now() + " </span>";
                          sendEmail(to, subject, text);
                        }
                      });
                    }
                  });
                }
              });

            });


          });

        }

      ]);
    });
  });
}
