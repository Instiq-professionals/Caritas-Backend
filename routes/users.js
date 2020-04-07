const auth = require('../middleware/auth');
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const {User, validate} = require('../models/user');
const NewsLetterModel = require('../models/NewsletterSubscription');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Joi = require('joi');

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
    });

    //check if email already registered
    let user = await User.findOne({ email: req.body.email });
    // if (user) return res.status(400).send();
    if(user) return res.status(400).json({
        status: 'Bad request',
        message: 'This Email already exists in our database',
    });

    //save data in the user table
    user = new User(_.pick(req.body, ['first_name', 'last_name', 'email', 'password', 'role']));
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
       data: _.pick(user, ['_id', 'first_name', 'last_name', 'email'])
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
            message: error.details[0].message
        });

        let user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(400).json({
            status: 'Bad request',
            message: 'Invalid email or password'
        });

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(400).json({
            status: 'Bad request',
            message: 'Invalid email or password'
        });

        //generate a token
        const token = user.generateAuthToken();
        res.header('x-auth-token', token).status(200).json({
            status: 'success',
            message: 'You have logged in successfully!',
           data: _.pick(user, ['_id', 'first_name', 'last_name', 'email'])
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
                        Create User (Admin Only)
=================================================================================
*/


module.exports = router;