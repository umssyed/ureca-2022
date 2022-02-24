const mongoose = require('mongoose');

const userReviewSchema = new mongoose.Schema({
  comment: String,

  overallRating: {
   type: Number,
   required: true,
   default: 0
  },
  tutor : {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('UserReview', userReviewSchema);
