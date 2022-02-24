//This function is used to add ratings
//Called in classReviewRoutes.js
//Adds rating to the Class
module.exports = function addRating(foundClass, reviews) {
  //Find the total number of reviews length and add one
  let reviewsLength = foundClass.classReviews.length + 1;
  //Update the raw values for each rating
  foundClass.overallRaw += reviews.overallRating;
  foundClass.clarityRaw += reviews.clarityRating;
  foundClass.usefulnessRaw += reviews.usefulnessRating;
  foundClass.knowledgeRaw += reviews.knowledgeRating;

  //Update the average values for each rating
  foundClass.overallAvg = foundClass.overallRaw/reviewsLength;
  foundClass.clarityAvg = foundClass.clarityRaw/reviewsLength;
  foundClass.usefulnessAvg = foundClass.usefulnessRaw/reviewsLength;
  foundClass.knowledgeAvg = foundClass.knowledgeRaw/reviewsLength;

  //Push the new ratings to the star rating array and save the Class to the db
  foundClass.classReviews.push(reviews);
  //Go next
  return;
}
