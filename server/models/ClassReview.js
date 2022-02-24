const mongoose = require('mongoose');

const classReviewSchema = new mongoose.Schema({
  comment: String,

  overallRating: {
   type: Number,
   required: true,
   default: 0,
  },

  clarityRating: {
   type: Number,
   required: true,
   default: 0
  },

  usefulnessRating: {
   type: Number,
   required: true,
   default: 0
  },

  knowledgeRating: {
   type: Number,
   required: true,
   default: 0
  },


  hours: Number, //check for float

  classID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class"
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  createdAt: {type: Date, default: Date.now}
});


//Add enrollment model
module.exports = mongoose.model('ClassReview', classReviewSchema);
