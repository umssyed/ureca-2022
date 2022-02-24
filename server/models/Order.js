const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
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
  messages: [{
    message: { type: String },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    date: {
      type: Date
    }
  }],
  createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Order', OrderSchema);
