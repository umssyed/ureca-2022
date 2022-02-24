const express = require('express');
const router  = express.Router();
const async = require('async');
const User    = require('../models/User');
const Class   = require('../models/Class');
const Booking = require('../models/Booking');
const stripe = require('stripe')('sk_test_fYJejaVi3lB3WVfDv81BBtZO');
