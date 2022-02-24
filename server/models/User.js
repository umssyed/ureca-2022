const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const URLSlugs = require('mongoose-url-slugs');
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const deepPopulate = require('mongoose-deep-populate')(mongoose);

const userSchema = new mongoose.Schema({
  //automatically set to False when first registered
  isTutor: Boolean,

  //username is email provided by user
  username: {
    type: String,
    unique: true,
    required: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  //basic information about every user
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  password: String,
  gender: String,
  profilePhoto: String,
  city:{
    type: String,
    default: undefined,
    required: false
  },
  province:{
    type: String,
    default: undefined,
    required: false
  },
  country:{
    type: String,
    default: undefined,
    required: false
  },
  authyId: String,
  createdAt: { type: Date, default: Date.now},
  phoneNumber: Number,

  //about me sections for the user/tutor
  tutorExperience: {
    type: String,
    default: ''
  },
  aboutMe: {
    type: String,
    default: ''
  },
  languages: [{
    type: String,
    default: ''
  }],
  occupation: {
    type: String,
    default: ''
  },
  workplace: {
    type: String,
    default: ''
  },
  education: {
    type: String,
    default: ''
  },
  school: [{
    type: String,
    default: ''
  }],
  // travel: {
  //   type: String,
  // },
  teachingLocations:  [{
    type: String,
    default: ''
  }], //Where is the tutor willing to travel/teach in. Required

  notifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Notification",
  }],

  //reviews provided by other users
  userReviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserReview",
  }],

  //overall raw user rating
  overallRaw: {
    type: Number,
    default: 0
  },

  //average values for overal rating
  overallAvg: {
    type: Number,
    default: 0
  },

  //posted reviews to other classes
  postedClassReview: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
  }],

  //posted reviews to other users
  postedUserReview: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserReview",
  }],

  //bookings
  studentBooking: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
  }],

  tutorBooking: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
  }],

  //classes previously enrolled in
  enrolledClasses: [{
    enrolledClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    enrolledNumber: Number,
    postedReview: Boolean,
  }],

  //tutors list - tutors user has taken class with
 tutorList: [{
   tutor: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "User"
   },
   postedReview: Boolean
 }],

  //Stripe Account ID
  stripeAccountID: String,
  stripe_id: String,


  //====FUTURE USE====//
  //verification with Google, FB, LinkedIn IDs
  facebook: {
    facebookId: String,
    token: String,
    email: String
  },
  google: {
    googleId: String,
    token: String,
    email: String
  },
});

userSchema.plugin(deepPopulate);
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(URLSlugs('firstName lastName', {alwaysRecreate: true, update: true}));
module.exports = mongoose.model('User', userSchema);
