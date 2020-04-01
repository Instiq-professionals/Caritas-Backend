const config = require('config');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const mongoose = require('mongoose');
const users = require('./routes/users');
const auth = require('./routes/auth');
const causes = require('./routes/causes');
const express = require('express');
const app = express();


//check if JWT secrete key is set
if(!config.get('jwtPrivateKey')){
    console.error('FATAL ERROR: jwtPrivateKey is not defined.');
    process.exit(1);
}

//db connection
mongoose.connect('mongodb://localhost/caritas')
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

//routes
app.use(express.json());
app.use(express.static('uploads'));
app.use('/api/users', users);
app.use('/api/auth', auth);
app.use('/api/cause', causes);

//listen on app port
// app.listen(3000, () => console.log(`Listening on port 3000...`));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));