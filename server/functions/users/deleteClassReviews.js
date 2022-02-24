//This function is used to delete classID from postedClassReview array
//Called in classReviewRoutes.js
//Deletes and updates postedClassReview array

module.exports = function deleteClassReviews(foundUser, foundClass) {
  console.log('inside delete class reviews fn');

  //Declare variables
  let element = 0;
  let length = foundUser[0].postedClassReview.length;

  //Loop through the postedClassReview array to find a match with classID
  for(let i = 0; i < length; i++) {
    if(foundUser[0].postedClassReview[i].equals(foundClass[0]._id)) {
      element = i;
    }
  }

  //Delete reference
  foundUser[0].postedClassReview.splice(element, 1);

  //Go next
  return;
}
