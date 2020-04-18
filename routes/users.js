const auth = require('../middleware/auth');
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const {User, validate} = require('../models/user');
const NewsLetterModel = require('../models/NewsletterSubscription');
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const nodemailer = require('nodemailer');

/*
=================================================================================
                        User Registration
=================================================================================
*/
router.post('/register', async (req, res) => {
    // validate request data
    const { error } = validate(req.body);
    // if (error) return res.status(400).send();
    if(error) return res.status(400).json({
        status: 'Bad request',
        message: error.details[0].message,
        data:[]
    });

    //check if email already registered
    let user = await User.findOne({ email: req.body.email });
    // if (user) return res.status(400).send();
    if(user) return res.status(400).json({
        status: 'Bad request',
        message: 'This Email already exists in our database',
        data:[]
    });

    //save data in the user table
    user = new User(_.pick(req.body, ['first_name', 'last_name', 'email', 'password', 'role', 'address', 'phone_number',
        'bank_name', 'account_number', 'account_type']));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    await user.save();

    //save user email to newsletter document
    const email =  req.body.email;
    subscribeForNewsLetter(email);

    //generate a token
    const token = user.generateAuthToken();

    res.header('x-auth-token', token).status(200).json({
        status: 'success',
        message: 'You have been registered!',
       data: _.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role', 'address', 'phone_number',
       'bank_name', 'account_number', 'account_type'])
    });
});


// subscribe to newsleter after user registration
async function subscribeForNewsLetter(email){

    const newsLetterSubscription = new NewsLetterModel.NewsLetter({
        email: email
    });
    await newsLetterSubscription.save();
}


/*
=================================================================================
                        User Login
=================================================================================
*/

router.post('/login', async (req, res) => {
    try{
        const { error } = validateLogin(req.body);
        if (error) return res.status(400).json({
            status: 'Bad request',
            message: error.details[0].message,
            data:[]
        });

        let user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(400).json({
            status: 'Bad request',
            message: 'Invalid email or password',
            data:[]
        });

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(400).json({
            status: 'Bad request',
            message: 'Invalid email or password',
            data:[]
        });

        //generate a token
        const token = user.generateAuthToken();
        res.header('x-auth-token', token).status(200).json({
            status: 'success',
            message: 'You have logged in successfully!',
           data: _.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role'])
        });
    }catch(e){
        console.log(e);
    }
});


function validateLogin(req){
    const schema = {
        email: Joi.string().min(5).max(255).required(),
        password: Joi.string().min(8).max(255).required(),
    };

    return Joi.validate(req, schema);
}

/*
=================================================================================
                        Password reset endpoints
=================================================================================
*/

//                        forgot password endpoint
//=================================================================================
router.post('/forgot_password', async (req, res) => {
    try{
        let user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(400).json({
            status: 'Bad request',
            message: 'Sorry, this email does not exist in our records.',
            data:[]
        });

        //generate a token
        const token = user.generateAuthToken();
        
        //send mail

        // async..await is not allowed in global scope, must use a wrapper
        // async function main() {
        const main = async (token, user) =>{
            // Generate test SMTP service account from ethereal.email
            // Only needed if you don't have a real mail account for testing
            let testAccount = await nodemailer.createTestAccount();

            // create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass // generated ethereal password
                }
            });

            // send mail with defined transport object
            let info = await transporter.sendMail({
                from: '"Fred Foo 👻" <foo@example.com>', // sender address
                to: "bar@example.com, baz@example.com", // list of receivers
                subject: "Hello ✔", // Subject line
                text: "Blah blah", // plain text body
                html: "<b>Blah blah</b>" // html body
            });

            console.log("Message sent: %s", info.messageId);
            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

            // Preview only available when sending through an Ethereal account
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        };

        main().catch(console.error);

        // const sendPasswordResetEmail = async (token, user) =>{
        //     let smtpTransport = nodemailer.createTransport({
        //         service: 'Gmail',
        //         auth:{
        //             user: 'augustineumeagudosi@gmail.com',
        //             password: config.get('emailPassword')
        //         }
        //     });

        //     let mailOptions = {
        //         to: user.email,
        //         from: 'info@instiqcaritas.com',
        //         text: 'You are receiving this email because you (or someone else) have requested to change your password' +
        //             'If it is you, please click on the link below to reset your password.' +
        //             'http://'+ req.header.host + '/reset_password/' + token + '\n\n' +
        //             'Please ignore this email if you did not request for a password reset.',
        //     };
        //     smtpTransport.sendMail(mailOptions);
        // };

        // await sendPasswordResetEmail(token, user);

        //save token to db
        user.password_reset_token = token;
        user.password_reset_token_expires_on = Date.now() + 3600000;  //expires in 1 hour
        user.updated_at = Date.now();
        await user.save();

        return res.status(200).json({
            status: 'Success',
            message: 'An email was sent to ' + user.email + ' please check your email and follow the instructions therein.',
            data:[]
        });

    }catch(e){
        console.log(e);
    }
});

//                        Reset password endpoint 
// (protected by middleware to check for token validity or expired token)
//=================================================================================




module.exports = router;