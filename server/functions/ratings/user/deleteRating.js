//This function is used to delete ratings
//Called in userReviewRoutes.js
//Deletes rating to the User

module.exports = function deleteRating(user, reviews) {
  //Find the total number of reviews length and add one
  let reviewsLength = user.userReviews.length;
  let element = 0;

  //Update the ratings
  if(reviewsLength == 1) {
    //Update the raw values if no existing rating
    user.overallRaw = 0;

    //Update the average values if no existing rating
    user.overallAvg = 0;

  } else {
    //Update the raw values for each rating
    user.overallRaw -= reviews[0].overallRating;

    //Update the average values for each rating
    user.overallAvg = user.overallRaw/(reviewsLength-1);

  }

  //Loop through the user reviews in the user model to identify a match
  for(let i = 0; i < reviewsLength; i++) {
    if(user.userReviews[i].equals(reviews[0]._id)) {
      element = i;
    }
  }
  //Delete the reference
  user.userReviews.splice(element, 1);
  //Go next
  return;
}
