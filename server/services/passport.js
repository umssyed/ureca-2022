const passport        = require('passport');
const LocalStrategy   = require('passport-local').Strategy;
const GoogleStrategy  = require('passport-google-oauth20').Strategy;
const mongoose        = require('mongoose');
const config = require('../config/configKeys');
const User = require('../models/User');

//PASSPORT STRATEGY AND CONFIGURATION//
//local-strategy
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());





//google o-auth20 strategy
// passport.use(
//   new GoogleStrategy({
//   clientID: keys.googleClientID,
//     clientSecret: keys.googleClientSecret,
//     callbackURL: '/api/signin/google/callback'
//   }, (accessToken, refreshToken, profile, done) => {
//     User.findOne({ googleId: profile.id}, (err, existingUser) => {
//         console.log('step 1');
//         console.log(profile.id);
//         console.log(err);
//         console.log(existingUser);
//         if(err) {
//           console.log('step 2');
//           console.log('google_oauth_error', err);
//         }
//         if(existingUser) {
//           //we already have a user with the given google profile id
//           console.log('step 3');
//           done(null, existingUser);
//         } else {
//           console.log('step 4');
//           //we dont have a user with this google profile id, lets make a new one
//           new User({
//               googleId: profile.id,
//               firstName: profile.name.givenName,
//               lastName: profile.name.familyName,
//               gender: profile.gender,
//               email: profile.emails[0].value,
//               profilePicture: profile.photos[0].value,
//               isTutor: false,
//             })
//             .save()
//             .then(newUser => done(null, newUser));
//         }
//     });
//   })
// );
