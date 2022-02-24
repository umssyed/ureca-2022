const express         = require('express');
const bearerToken     = require('express-bearer-token');
const bodyParser      = require('body-parser');
const methodOverride  = require('method-override');
const User    = require('./server/models/User');
const morgan          = require('morgan');
const path            = require('path');
const passport        = require('passport');
const passportSocketIo = require('passport.socketio');
const passportConfig  = require('./server/services/passport');
const stripe          = require('./server/services/stripe');
const config            = require('./server/config/configKeys');
const mongoose        = require('mongoose');
const session         = require('express-session');
const MongoStore      = require('connect-mongo')(session);
const flash           = require('connect-flash');
const cookieParser    = require('cookie-parser');
const awsS3       = require('./server/services/amazons3');

//REQUIRE ROUTES
const indexRoutes     = require('./server/routes/index');
const authRoutes      = require('./server/routes/authRoutes');
const userRoutes      = require('./server/routes/userRoutes');
const classRoutes     = require('./server/routes/classRoutes');
const classReviewsRoutes   = require('./server/routes/classReviewsRoutes');
const userReviewsRoutes   = require('./server/routes/userReviewsRoutes');
const notificationsRoutes = require('./server/routes/notifications');
const blackboardRoutes = require('./server/routes/blackboardRoutes');
const bookingRoutes    = require('./server/routes/bookingRoutes');
const messageRoutes = require('./server/routes/messageRoutes');
const paymentRoutes = require('./server/routes/Payment');



//APP DECLARATION
const app             = express();
const http            = require('http').Server(app);
const io              = require('socket.io')(http);
const sessionMiddleware = session ({
  resave: true,
  saveUninitialized: true,
  secret: config.sessionSecret,
  store: new MongoStore({ url: config.DATABASE, autoReconnect: true }),
  autoRemove: 'interval',
  autoRemoveInterval: 1
});

//APP PROPERTIES
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(express.static(__dirname + '/public'));

// const promise = mongoose.connect(keys.mongoURI);
const promise = mongoose.connect(config.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
  function(err) {
    if(err) {
      console.log(err)
    } else {
      app.use(require('express-session')({
        resave: true,
        saveUninitialized: true,
        secret: config.sessionSecret,
        store: new MongoStore({ url: config.DATABASE, autoReconnect: true }),
        autoRemove: 'interval',
        autoRemoveInterval: 1
      }));
    }
  }
});
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(flash());
//Passport Config
app.use(require('express-session')({
  resave: true,
  saveUninitialized: true,
  secret: config.sessionSecret,
  store: new MongoStore({ url: config.DATABASE, autoReconnect: true }),
  autoRemove: 'interval',
  autoRemoveInterval: 1
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(cookieParser());
app.use(function(req,res, next) {
  res.locals.currentUser  = req.user;
  app.locals.moment = require('moment');
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});


//USE ROUTES
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/', userRoutes);
app.use('/', classRoutes);
app.use('/', classReviewsRoutes);
app.use('/', userReviewsRoutes);
app.use('/', notificationsRoutes);
app.use('/blackboard', blackboardRoutes);
app.use('/', bookingRoutes);
app.use('/', paymentRoutes);
app.use('/inbox', messageRoutes);

//SOCKET IO
require('./server/realtime/io')(io);
io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key: 'connect.sid',
  secret: config.sessionSecret,
  store: new MongoStore({ url: config.DATABASE, autoReconnect: true }),
  success: onAuthorizeSuccess,
  fail: onAuthorizeFail
}));

io.use(function(socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});

function onAuthorizeSuccess(data, accept) {
  console.log('Successful Connection to Socket.IO');
  accept();
};

function onAuthorizeFail(data, message, error, accept) {
  console.log('Failed connection with Socket.IO');
  if(error) {accept(new Error(message));}
};

//The 404 Route
app.use('*', function(req,res){
    //If logged in, show header with logged in user
    if(req.isAuthenticated()) {
      User.findById({_id: req.user._id}).exec((err, foundUser) => {
        if(err) {}
        res.render('404', { User: foundUser});
      });
    } else {
    //If not logged in, then show with Login and Signup buttons
      res.render('404', { User: undefined });
    }
});

//LISTEN TO PORT//
const PORT = process.env.PORT || 5000;
http.listen(PORT, () => {
  console.log('====> Ureca Backend has booted! <====');
  console.log('running on port: ' + PORT);
});
