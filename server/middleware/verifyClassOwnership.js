const Class   = require('../models/Class');

//Verify if user owns the class
module.exports = function verifyClassOwnership(req, res, next) {

  Class.find({_id: req.params.id}, (err, foundClass) => {
    if(err) {
      req.flash('error', 'The requested class could not be found');
      //If class is not found
      res.redirect('back');
    } else {
      //If class is found, does the user own the class
      if(foundClass[0].author.equals(req.user._id)) {
        //Authorized
        return next();
      } else {
        req.flash('error', 'Oops! Seems like you do not have the permissions to make changes to the class.');
        //Unauthorized
        res.redirect('back');
      }
    }
  });

};
