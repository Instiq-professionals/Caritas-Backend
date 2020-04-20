const auth = require('../middleware/auth');
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const {User, validate, validatePassword} = require('../models/user');
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
        'bank_name', 'account_number', 'account_type', 'account_name']));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    await user.save();

    //save user email to newsletter document
    const email =  req.body.email;
    subscribeForNewsLetter(email);

    //generate a token
    const token = user.generateAuthToken();

    res.status(200).json({
        status: 'success',
        message: 'You have been registered!',
       data: _.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role', 'address', 'phone_number',
       'bank_name', 'account_number', 'account_type', 'account_name'])
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
           data: _.pick(user, ['_id',  'first_name', 'last_name', 'email', 'role', 'address', 'phone_number',
           'bank_name', 'account_number', 'account_type', 'account_name'])
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
         let link = 'http://'+'localhost:3000/api/users'+'/reset_password/' + token;
        //  console.log(link);
        
        //send mail
        const mail = async (token, user) =>{
            // create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport({
                host: "mail.instiq.com",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                user: "support.caritas@instiq.com",
                pass: config.get('emailPassword')
                },
                tls:{
                    rejectUnauthorized:false
                }
            });

            // send mail with defined transport object
            let info = await transporter.sendMail({
                from: '"Caritas" <support.caritas@instiq.com>', // sender address
                to: req.body.email, // list of receivers
                subject: "Password Reset", // Subject line
                text: 'You are receiving this email because you (or someone else) have requested to change your password. If it is you, please click on the link below to reset your password.' + 
                        link + '\n\n' + 'Please ignore this email if you did not request for a password reset.',
        
                html: ` 
                        <p> You are receiving this email because you (or someone else) have requested to change your password</p>
                        <p> If it is you, please click on the link below to reset your password. Please ignore this email if you did not request for a password reset.</p> 
                        <a href = '${link}' style=""background-color: #FC636B> ${link}</a>
                     `

            });

            console.log("Message sent: %s", info.messageId);
        };

        mail().catch(console.error);

        
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
//=================================================================================
router.put('/update_password/:token', async (req, res) => {
    //validate request body
    const { error } = validatePassword(req.body);
    if (error) return res.status(400).json({
        status: 'Bad request',
        message: error.details[0].message,
        data:[]
    });

    //check if token exits on the database or if token has expired
    let user = await User.findOne({ password_reset_token: req.params.token, password_reset_token_expires_on: {$gt: Date.now()} });
    if(!user) return res.status(400).json({
        status: 'Bad request',
        message: 'Invalid or expired token',
        data:[]
    });

    //update user password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    // user.password_reset_token = null;
    // user.password_reset_token_expires_on = null;

    await user.save();

    //generate a token
    const token = user.generateAuthToken();

    res.header('x-auth-token', token).status(200).json({
        status: 'success',
        message: 'Your password hass been changed successfully!',
       data: _.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role', 'address', 'phone_number',
       'bank_name', 'account_number', 'account_type', 'account_name'])
    });
});


module.exports = router;