const auth = require('../middleware/auth');
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const {User, validate, validatePassword} = require('../models/user');
const {NewsLetter} = require('../models/NewsletterSubscription');
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const nodemailer = require('nodemailer');
const mailer = require('../helpers/sendMail');

/*
=================================================================================
                        User Registration
=================================================================================
*/
router.post('/register', async (req, res) => {
    try {
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

        //generate a token
        const token = jwt.sign({email: req.body.email}, config.get('jwtPrivateKey'));

        //save data in the user table
        user = new User(_.pick(req.body, ['first_name', 'last_name', 'email', 'password', 'role', 'address', 'phone_number',
            'bank_name', 'account_number', 'account_type', 'account_name', 'verify_email_token', 'verify_email_token_expires_on']));
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user.verify_email_token = token;
        user.verify_email_token_expires_on = Date.now() + 3600000;  //expires in 1 hour

        await user.save();

        //save user email to newsletter document
        const email =  req.body.email;
        subscribeForNewsLetter(email);

        // let link = 'http://'+ req.headers.host +'/users/verify_email/' + token;
        const link = 'http://'+ req.headers.host +'/users/verify_email/' + token;
        const subject = "Email Verification";
        const emailText = 'You are receiving this email because you (or someone else) recently created an account on http://www.caritas.instiq.com with this email address. If it is you, kindly click on the link below to confirm your email address.' + 
                            link + '\n\n' + 'Please ignore this email if you did not create this account.';
        const htmlText = ` 
                            <p> You are receiving this email because you (or someone else) recently created an account on <a href="http://www.caritas.instiq.com">www.caritas.instiq.com</a> with this email address</p>
                            <p> If it is you, kindly click on the link below to confirm your email address. Please ignore this email if you did not create this account.</p> 
                            <a href = '${link}'> ${link}</a>
                        `;
        //send mail
        mailer({
            from: '"Caritas" <support.caritas@instiq.com>',
            to: user.email,
            subject: subject,
            text: emailText,
            html: htmlText
        });

        res.status(200).json({
            status: 'success',
            message: 'You have been registered!',
        data: _.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role', 'address', 'phone_number',
        'bank_name', 'account_number', 'account_type', 'account_name', 'isEmailVerified'])
        });

    } 
    catch (error) {
        console.log(error);
    }
});

/*
=================================================================================
                        Newsletter subscription
=================================================================================
*/

// subscribe to newsleter after user registration
async function subscribeForNewsLetter(email){
    let emailExists = await NewsLetter.findOne({ email: email });
    if (!emailExists){
        const newsLetterSubscription = new NewsLetter({
            email: email
        });
        await newsLetterSubscription.save();
    }
}

router.post('/newsletter_subscription', async (req, res) => {
    try{
        let emailExists = await NewsLetter.findOne({email: req.body.email});
        if(!emailExists){
            const subscribeUser = new NewsLetter({
                email: req.body.email
            });
            await subscribeUser.save();
        }
        res.status(200).json({
            status: 'success',
            message: 'You have been subscribed to our weekly newsletter',
            data: _.pick(emailExists, ['_id', 'email', 'isSubscribed'])
        });
    }catch(e){
        console.log(e);
    }
});
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
        if (user.isEmailVerified == true) return res.header('x-auth-token', token).status(200).json({
            status: 'success',
            message: 'You have logged in successfully!',
           data: _.pick(user, ['_id',  'first_name', 'last_name', 'email', 'role', 'address', 'phone_number',
           'bank_name', 'account_number', 'account_type', 'account_name', 'isEmailVerified'])
        });

        return res.status(206).json({
            status: 'Partial content',
            message: 'Please verify your email address',
           data: []
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
        //  let link = 'http://'+ req.headers.host +'/users/reset_password/' + token;
        
        //send mail
        let link = 'http://'+ req.headers.host +'/users/reset_password/' + token;
        const subject = "Password Reset";
        const emailText = 'You are receiving this email because you (or someone else) have requested to change your password. If it is you, kindly click on the link below to reset your password.' + 
                            link + '\n\n' + 'Please ignore this email if you did not request for a password reset.';
        const htmlText = ` 
                            <p> You are receiving this email because you (or someone else) have requested to change your password</p>
                            <p> If it is you, kindly click on the link below to reset your password. Please ignore this email if you did not request for a password reset.</p> 
                            <a href = '${link}'> ${link}</a>
                        `;
        //send mail
        mailer({
            from: '"Caritas" <support.caritas@instiq.com>',
            to: req.body.email,
            subject: subject,
            text: emailText,
            html: htmlText
        });
        
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
    user.password = await bcrypt.hash(req.body.password, salt);
    user.password_reset_token = null;
    user.password_reset_token_expires_on = null;

    await user.save();

    //generate a token
    const token = user.generateAuthToken();

    res.header('x-auth-token', token).status(200).json({
        status: 'success',
        message: 'Your password has been changed successfully!',
       data: _.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role', 'address', 'phone_number',
       'bank_name', 'account_number', 'account_type', 'account_name', 'isEmailVerified'])
    });
});



/*
=================================================================================
                        Email verification endpoints
=================================================================================
*/

//                        Generate verification token endpoint 
//=================================================================================
router.post('/generate_verification_token',auth, async (req, res) => {
    //get user
    let user = await User.findById(req.user._id);
    if(!user) return res.status(400).json({
        status: 'Bad request',
        message: 'No user found',
        data:[]
    });

    if(user.isEmailVerified == 1) return res.status(400).json({
        status: 'Bad request',
        message: 'You have verified your email address',
        data:[]
    });

    //generate a token
    const token = jwt.sign({email: user.email}, config.get('jwtPrivateKey'));
    user.verify_email_token = token;
    user.verify_email_token_expires_on = Date.now() + 3600000;  //expires in 1 hour

    await user.save();

    const link = 'http://'+ req.headers.host +'/users/verify_email/' + token;
    const subject = "Email Verification";
    const emailText = 'You are receiving this email because you (or someone else) recently created an account on http://www.caritas.instiq.com with this email address. If it is you, kindly click on the link below to confirm your email address.' + 
                        link + '\n\n' + 'Please ignore this email if you did not create this account.';
    const htmlText = ` 
                        <p> You are receiving this email because you (or someone else) recently created an account on <a href="http://www.caritas.instiq.com">www.caritas.instiq.com</a> with this email address</p>
                        <p> If it is you, kindly click on the link below to confirm your email address. Please ignore this email if you did not create this account.</p> 
                        <a href = '${link}'> ${link}</a>
                    `;
    //send mail
    mailer({
        from: '"Caritas" <support.caritas@instiq.com>',
        to: user.email,
        subject: subject,
        text: emailText,
        html: htmlText
    });

    res.status(200).json({
        status: 'success',
        message: 'A new verification email has been sent to your email inbox.'+
                 'Please check your mail and follow the instructions therein to confirm your account',
       data:[]
    });
});


//                        Verify email endpoint 
//=================================================================================
router.put('/confirm_email/:token', async (req, res) => {

    //check if token exits on the database or if token has expired
    let user = await User.findOne({ verify_email_token: req.params.token, verify_email_token_expires_on: {$gt: Date.now()} });
    if(!user) return res.status(400).json({
        status: 'Bad request',
        message: 'Invalid or expired token',
        data:[]
    });

    //Verify email
    user.isEmailVerified = 1;
    user.verify_email_token = null;
    user.verify_email_token_expires_on = null;

    await user.save();

    //generate a token
    const token = user.generateAuthToken();

    res.header('x-auth-token', token).status(200).json({
        status: 'success',
        message: 'Your email has been verified successfully!',
       data: _.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role', 'address', 'phone_number',
       'bank_name', 'account_number', 'account_type', 'account_name', 'isEmailVerified'])
    });
});

module.exports = router;