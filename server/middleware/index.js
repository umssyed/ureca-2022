const isLoggedIn = require('./isLoggedIn');
const verifyClassOwnership = require('./verifyClassOwnership');
const verifyClassReviewOwnership = require('./verifyClassReviewOwnership');
const verifyUserOwnership = require('./verifyUserOwnership');
const verifyUserReviewOwnership = require('./verifyUserReviewOwnership');
const hasClassReview = require('./hasClassReview');
const bookClass = require('./bookClass');

const middleware = {
  isLoggedIn : isLoggedIn,
  verifyClassOwnership : verifyClassOwnership,
  verifyClassReviewOwnership : verifyClassReviewOwnership,
  verifyUserOwnership : verifyUserOwnership,
  verifyUserReviewOwnership : verifyUserReviewOwnership,
  hasClassReview: hasClassReview,
  bookClass: bookClass
};

module.exports = middleware;
