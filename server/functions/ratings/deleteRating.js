//This function is used to delete ratings
//Called in classReviewRoutes.js
//Deletes rating to the Class

module.exports = function deleteRating(foundClass, reviews) {
  //Find the total number of reviews length and add one
  let reviewsLength = foundClass[0].classReviews.length;
  let element = 0;

  //Update the ratings
  if(reviewsLength == 1) {
    //Update the raw values if no existing rating
    foundClass[0].overallRaw = 0;
    foundClass[0].knowledgeRaw = 0;
    foundClass[0].clarityRaw = 0;
    //Update the average values if no existing rating
    foundClass[0].overallAvg = 0;
    foundClass[0].knowledgeAvg = 0;
    foundClass[0].clarityAvg = 0;
  } else {
    //Update the raw values for each rating
    foundClass[0].overallRaw -= reviews[0].overallRating;
    foundClass[0].knowledgeRaw -= reviews[0].knowledgeRating;
    foundClass[0].clarityRaw -= reviews[0].clarityRating;
    //Update the average values for each rating
    foundClass[0].overallAvg = foundClass[0].overallRaw/(reviewsLength-1);
    foundClass[0].knowledgeAvg = foundClass[0].knowledgeRaw/(reviewsLength-1);
    foundClass[0].clarityAvg = foundClass[0].clarityRaw/(reviewsLength-1);
  }

  //Loop through the class reviews in the class model to identify a match
  for(let i = 0; i < reviewsLength; i++) {
    if(foundClass[0].classReviews[i].equals(reviews[0]._id)) {
      element = i;
    }
  }
  //Delete the reference
  foundClass[0].classReviews.splice(element, 1);
  //Go next
  return;
}
