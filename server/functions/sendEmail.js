//This function is used to send emails
const nodemailer = require('nodemailer');
const config     = require('../../server/config/configKeys');

//Send email
module.exports = function sendEmail(to, subject, text) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
          user: config.emailUser, // generated ethereal user
          pass: config.emailPass // generated ethereal password
      },
      tls: {
        rejectUnauthorized: false
      }
  });
  // setup email data with unicode symbols
  let mailOptions = {
      from: 'Ureca <uzair@ureca.com>', // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      html: text,

  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('the email has been sent!');
      console.log('INFO: ', info);
  });
  //Go next
  return;
}
