//This function is used to delete postedUserReview
//Called in userReviewRoutes.js
//Deletes postedUserReview reference to the main User

module.exports = function deletePostedReview(user, reviews) {
  //Find the total number of reviews length and add one
  let reviewsLength = user.postedUserReview.length;
  let element = 0;
console.log(reviews[0]._id);
  //Loop through the user posted reviews in the user model to identify a match
  for(let i = 0; i < reviewsLength; i++) {
    if(user.postedUserReview[i].equals(reviews[0]._id)) {
      element = i;
    }
  }
  //Delete the reference
  user.postedUserReview.splice(element, 1);
  //Go next
  return;
}
