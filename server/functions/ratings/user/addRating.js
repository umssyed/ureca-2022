// FOR USER REVIEWS RATINGS

//This function is used to add ratings
//Called in userReviewRoutes.js
//Adds rating to the User
module.exports = function addRating(user, reviews) {
  //Find the total number of reviews length and add one
  let reviewsLength = user.userReviews.length + 1;
  //Update the raw values for each rating
  user.overallRaw += reviews.overallRating;

  //Update the average values for each rating
  user.overallAvg = user.overallRaw/reviewsLength;

  //Go next
  return;
}
