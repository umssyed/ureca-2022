const express = require('express');
const router  = express.Router();
const async = require('async');
const User    = require('../models/User');
const Class   = require('../models/Class');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const middleware = require('../middleware/index');
const stripe = require('stripe')('sk_test_fYJejaVi3lB3WVfDv81BBtZO');

//Payment with Stripe
router.post('/payment', (req, res, next) => {
  var price = req.session.finalPrice;
  price *= 100;

  stripe.charges.create({
    amount: price,
    currency: 'cad',
    source: req.body.stripeToken,
    description: 'Test Charge'
  }).

  stripe.accounts.create({
    email: req.user.username,
    country: "CA",
    type: "standard"
  }).then(function(account) {
    return stripe.charges.create({
      amount: price,
      currency: 'cad',
      source: req.body.stripeToken,
      destination: {
        amount: 800,
        account: account.id,
      },
    }).then(function(charge) {
      console.log('CHARGE', charge);
      res.render('user/private/blackboard/overview', {User: req.user});

    });
  });
});

module.exports = router;
