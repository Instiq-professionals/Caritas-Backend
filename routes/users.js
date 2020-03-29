const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const {User, validate} = require('../models/user');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send('This Email already exists in our database');

    user = new User(_.pick(req.body, ['first_name', 'last_name', 'email', 'password']));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    await user.save();

    //generate a token
    const token = user.generateAuthToken();

    res.header('x-auth-token', token).send( _.pick(user, ['_id', 'first_name', 'last_name', 'email']));

    // res.send( _.pick(user, ['_id', 'first_name', 'last_name', 'email']));  for normal response without http header (token)
});

module.exports = router;