const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  content: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Message', MessageSchema);
