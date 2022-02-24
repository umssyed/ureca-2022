const mongoose = require('mongoose');
const deepPopulate = require('mongoose-deep-populate')(mongoose);

const BookingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class"
  },
  date: {
    type: Date,
    required: true
  },
  hours: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  }],
  createdAt: {type: Date, default: Date.now},
  status: {
    type: String,
    default: 'Pending'
  },
});

BookingSchema.plugin(deepPopulate);
module.exports = mongoose.model('Booking', BookingSchema);
