const config = require('config');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const users = require('./routes/users');
const roles = require('./routes/roles');
const causes = require('./routes/causes');
const stories = require('./routes/successStories');


//check if JWT secrete key is set
if(!config.get('jwtPrivateKey')){
    console.error('FATAL ERROR: jwtPrivateKey is not defined.');
    process.exit(1);
}

//db connectionf
mongoose.connect('mongodb://localhost/caritas')
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

//routes
// app.use(cors());
app.use(cors({
    exposedHeaders: ['x-auth-token'],
}));
app.options('*', cors());
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(express.static('uploads'));
app.use('/api/users', users);
app.use('/api/roles', roles);
app.use('/api/cause', causes);
app.use('/api/success_stories', stories);

//listen on app port
// app.listen(3000, () => console.log(`Listening on port 3000...`));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));