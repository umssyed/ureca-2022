const mongoose = require('mongoose');
const moment = require('moment');

const NotificationSchema = new mongoose.Schema({
  //slug to direct user to the appropriate page
  slug: String,
  element: String,
  //The item that the notification will show. Class/User Review or Message
  item: String,
  //Type of notification depends on type of activity
  type: String,
  //Timestamp of when the notificatoin was created
  createdAt: {type: Date, default: moment()},
  //Author of the notification
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  //Who is the notification for
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }
});
module.exports = mongoose.model('Notification', NotificationSchema);
