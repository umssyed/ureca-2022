const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');

const classSchema = new mongoose.Schema({
  //Class Date
  createdAt: { type: Date, default: Date.now},
  updatedAt: { type: Date, default: Date.now},

  //Class Information
  classTitle: {
   type: String,
   required: true
  },
  classDescription: {
    type: String,
  },
  mainSubject: {
    type: String,
    required: true
  },
  educationLevel: {
    type: String,
    required: true
  },

  //Details For Students
  prereq: [String], //All the pre-reqs for this class
  learningOutcome: [String], //Learning outcomes for the class
  materialsProvided: [String], //Supplementary materials provided
  topics: [String], //Highlight the main topics the class will cover
  institute: [String], //If it is related to institute
  courseCode: [String], //What course code in the institute is it related to
  textbook: [String],

  //Optional
  classType: {
    type: String,
  }, //one on one or group session

  //Price
  price: {
   type: Number,
   required: true,
   default: 0
  },

  //reference information
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  classReviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "ClassReview",
  }],
  city:{
    type: String,
    default: undefined,
  },
  province:{
    type: String,
    default: undefined,
  },
  country:{
    type: String,
    default: undefined,
  },

  //===Class Review Section====

  //Raw values for each rating
  overallRaw:{
   type: Number,
   default: 0
  },
  clarityRaw: {
   type: Number,
   default: 0
  },
  usefulnessRaw: {
   type: Number,
   default: 0
  },
  knowledgeRaw: {
   type: Number,
   default: 0
  },

  //Average values for each rating
  overallAvg: {
   type: Number,
   default: 0
  },
  clarityAvg: {
   type: Number,
   default: 0
  },
  usefulnessAvg: {
   type: Number,
   default: 0
  },
  knowledgeAvg: {
   type: Number,
   default: 0
  },
});


classSchema.plugin(URLSlugs('classTitle', {alwaysRecreate: true, update: true}));

let Model = mongoose.model('Class', classSchema);


// module.exports = mongoose.model('Class', classSchema);
module.exports = Model;
