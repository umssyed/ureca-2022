const express  = require('express');
const router   = express.Router();
const passport = require('passport');
const User     = require('../models/User');
const Class    = require('../models/Class');
const middleware = require('../middleware/index');
const sendEmail = require('../functions/sendEmail.js');

//INDEX ROUTES//
//DISPLAY LANDING PAGE
//DISPLAY HOW TO USE, TERMSCONDITIONS, CONTACT US PAGE
//SEARCH AND FILTER LOGIC

//Display landing page - index
router.get('/', (req, res) => {
  Class.find().exec((err, Class) => {
    if(err) {
      if(req.user) {
        return res.render('404', { User: req.user});
      } else {
        return res.render('404', { User: undefined });
      }
    } else {
      res.render('index', {Class: Class, User: req.user});
    }
  });
});

//Display Terms and Conditions page
router.get('/termsandconditions', (req, res) => {
  if(User) {
    res.render('termsandconditions', {User: req.user});
  } else {
    res.render('termsandconditions', {User: undefined});
  }
});

//Display Contact page
router.get('/contact', (req, res) => {
  if(User) {
    res.render('contact', {User: req.user});
  } else {
    res.render('contact', {User: undefined});
  }
});

router.post('/contact', (req, res) => {
  let to = 'uzair@gmail.com';
  let subject = req.body.subject;
  let text = '<b>Comment:</b> ' + req.body.message + '<br><br>' + '<b>Name:</b> ' + req.body.fullname + '</b><br><b>Email:</b> ' + req.body.email;
  sendEmail(to, subject, text);
  req.flash('success', 'Thank you for your feedback!');
  res.redirect("/contact");
  // res.render('contact', {User: req.user});
});


//Display How to use - Basics
router.get('/howtouse/basics', (req, res) => {
  if(req.user){
    res.render('howtouse/basics', {User: req.user});
  } else {
    res.render('howtouse/basics', {User: undefined});
  }
});

//Display How to use - Basics
router.get('/howtouse/tutor', (req, res) => {
  if(req.user){
    res.render('howtouse/tutor', {User: req.user});
  } else {
    res.render('howtouse/tutor', {User: undefined});
  }
});

//Display How to use - Basics
router.get('/howtouse/student', (req, res) => {
  if(req.user){
    res.render('howtouse/student', {User: req.user});
  } else {
    res.render('howtouse/student', {User: undefined});
  }
});

//Display Become a Tutor Page
router.get('/becometutor', (req, res) => {
  if(req.user){
    res.render('becometutor', {User: req.user});
  } else {
    res.render('becometutor', {User: undefined});
  }
});

//Search Results
router.get('/classes', (req, res) => {
  var noMatch = undefined;
  var search = null;
  //Convert the query rating to number
  var qrating = req.query.rating;
  var rating = parseInt(qrating, 10);
  //Set query to be an empty object
  var query = {};
  //Set queryFE to be a defined obj, this will be sent to Front end
  //To populate the selected fields after result is displayed
  var queryFE = {
    educationLevel: [], //set as an empty array
    mainSubject: [], //set as empty array
    price: null,
    rating: null,
    city: null
  };
  //Create basic setup for query
  query['$and']=[];
  //Filters set to empty array for education/subject
  var educationLevelFilter = [];
  var mainSubjectFilter = [];
  //Send through functions defined below
  educationLevelFn(educationLevelFilter, queryFE, req.query);
  mainSubjectFn(mainSubjectFilter, queryFE, req.query);

  //Build Filter Query Here
  if(educationLevelFilter.length > 0) {
    query['$and'].push(
      {educationLevel: educationLevelFilter},
    );
    // queryFE.educationLevel = educationLevelFilter
  };
  if(mainSubjectFilter.length > 0) {
    query['$and'].push(
      {mainSubject: mainSubjectFilter}
    );
    // queryFE.mainSubject = mainSubjectFilter
  };
  if(req.query.price && req.query.price > 0) {
    query['$and'].push(
      {price: {$lte: req.query.price}}
    );
    queryFE.price = req.query.price
  }
  if(rating) {
    query['$and'].push(
      {overallAvg: {$gte: rating}}
    );
    queryFE.rating = rating
  }
  if(req.query.city) {
    const regexCity = new RegExp(escapeRegex(req.query.city), 'gi');
    query['$and'].push(
      {city : regexCity}
    );
    queryFE.city= req.query.city
  }
  console.log('Query Builder: ', query['$and'][0]);

  //Define all filters here
  //This is used to check if any queries exists
  //And then determine which code to run.
  var filters = [
      req.query.any,
      req.query.preSchool,
      req.query.highSchool,
      req.query.under,
      req.query.post,
      req.query.bio,
      req.query.math,
      req.query.physics,
      req.query.chemistry,
      req.query.languages,
      req.query.socialStudies,
      req.query.socialSciences,
      req.query.rating,
      req.query.price,
      req.query.city
    ];

  // four cases
  // case 1: if filter undefined, no search entered
  // case 2: if filters undefined, search entered
  // case 3: if filter defined, no search entered
  // case 4: if filters defined, search entered

  //If there is a search entered
  if(req.query.search) {
    search = req.query.search;
    const regex = new RegExp(escapeRegex(search), 'gi');
    //If there are no filters defined
    // case 2: if filters undefined, search entered
    if(undefinedFilters(filters)) {

      Class.find({
        $or: [
          {classTitle: regex},
        ]
      })
      .populate([
        {
          path: 'author',
          model: 'User'
        }
      ])
      .exec((err, results) => {
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        }
        else {
          if(results.length < 1) {
            noMatch = 'No results found.';
          }
          res.render('search', {
            Class: results,
            noMatch: noMatch,
            search: search,
            User: req.user,
            queryFE: null
          });
        }
      });

    } else {
      //If there are filters defined
      // case 4: if filters defined, search entered
      Class.find({
        $and: [
          {$or: [
            {classTitle: regex},
            // {courseCode: regex}
          ]},
          query,
        ],

      })
      .populate([
        {
          path: 'author',
          model: 'User'
        }
      ])
      .exec((err, results) => {
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        }
        else {

          if(results.length < 1) {
            noMatch = 'No results found.';
          }
          res.render('search', {
            Class: results,
            noMatch: noMatch,
            search: search,
            User: req.user,
            queryFE: queryFE
          });

        }
      });
    }

  } else {
    //If no search is entered, display all
    // case 1: if filter undefined, no search entered
    if(undefinedFilters(filters)) {
      Class.find().exec((err, results) => {
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        } else {
          res.render('search', {
            Class: results,
            noMatch: noMatch,
            search:search,
            User: req.user,
            queryFE: null
          });
        }
      });
    } else {
      // case 3: if filters defined, no search entered
      Class.find({
        $and: [
          query,
        ],
      })
      .populate([
        {
          path: 'author',
          model: 'User'
        }
      ])
      .exec((err, results) => {
        if(err) {
          if(req.user) {
            return res.render('404', { User: req.user});
          } else {
            return res.render('404', { User: undefined });
          }
        }
        else {

          if(results.length < 1) {
            noMatch = 'No results found.';
          }
          res.render('search', {
            Class: results,
            noMatch: noMatch,
            search: search,
            User: req.user,
            queryFE: queryFE
          });

        }
      });
    }

  }
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

function undefinedFilters(filters) {
  //If filters are undefined, return true
  //If fitlers are defined, return false
  var length = filters.length;
  //Loop through the filters
  for(let i=0; i<length; i++) {
    //Check to see if any filters are defined
    //If any fitlers defined, return false
    if(filters[i] !== undefined) {
      return false;
    }
  }
  //If none of the filters are defined, then return true
  return true;
}

function educationLevelFn(array, array2, query) {
  if(query.any) {
    array.push(query.any);
    array2.educationLevel.push(query.any);
  }
  if(query.preSchool) {
    array.push(query.preSchool);
    array2.educationLevel.push(query.preSchool);
  }
  if(query.highSchool) {
    array.push(query.highSchool);
    array2.educationLevel.push(query.highSchool);
  }
  if(query.under) {
    array.push(query.under);
    array2.educationLevel.push(query.under);
  }
  if(query.post) {
    array.push(query.post);
    array2.educationLevel.push(query.post);
  }
}

function mainSubjectFn(array, array2, query) {
  if(query.bio) {
    array.push(query.bio);
    array2.mainSubject.push(query.bio);
  }
  if(query.math) {
    array.push(query.math);
    array2.mainSubject.push(query.math);
  }
  if(query.physics) {
    array.push(query.physics);
    array2.mainSubject.push(query.physics);
  }
  if(query.chemistry) {
    array.push(query.chemistry);
    array2.mainSubject.push(query.chemistry);
  }
  if(query.languages) {
    array.push(query.languages);
    array2.mainSubject.push(query.languages);
  }
  if(query.socialStudies) {
    array.push(query.socialStudies);
    array2.mainSubject.push(query.socialStudies);
  }
  if(query.socialSciences) {
    array.push(query.socialSciences);
    array2.mainSubject.push(query.socialSciences);
  }
}


module.exports = router;
