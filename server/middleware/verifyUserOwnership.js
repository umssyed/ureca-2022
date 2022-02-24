const User    = require('../models/User');
//In most cases the verifyUserOwnership middleware is not required.

//THIS APP DOES NOT USE THIS CODE anymore



//Verify if user owns the profile
module.exports = function verifyUserOwnership(req, res, next) {
  //If User is logged in
  if(req.isAuthenticated()) {

  }

  //If User is not logged in
  else {
    res.redirect('back');
  }
};
