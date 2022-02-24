const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  imageURL: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Photo', photoSchema);
