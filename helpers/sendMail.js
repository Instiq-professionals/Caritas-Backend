const config = require('config');
const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    host: "mail.instiq.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: config.get('email'),
        pass: config.get('emailPassword')
    },
    //use the following lines if you are testing the endpoint offline
    tls:{
        rejectUnauthorized:false
    }
});

let sendMail = (mailOptions)=>{
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
  });
};

module.exports = sendMail;