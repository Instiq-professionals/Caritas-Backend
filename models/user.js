const jwt = require('jsonwebtoken');
const config = require('config');
const Joi = require('joi');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema ({
    first_name:{
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50
    },

    last_name:{
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50
    },

    email:{
        type: String,
        required: true,
        minlength: 3,
        maxlength: 255,
        unique: true
    },

    role_id:{
        type: [String],
        required: true,
        minlength: 3,
        maxlength: 255,
        default: ['5e8535a762580929e05d8af7'],
    },

    isAVolunteer:{
        type: Boolean,
        required: true,
        minlength: 3,
        maxlength: 8,
        default: false
    },

    isEmailVerified:{
        type: Boolean,
        required: true,
        minlength: 3,
        maxlength: 8,
        default: false
    },

    created_by:{
        type: String,
        required: false,
        minlength: 2,
        maxlength: 50
    },

    created_at:{
        type: Date,
        required: true,
        default: Date.now,
        minlength: 2,
        maxlength: 50
    },

    updated_at:{
        type: Date,
        required: true,
        default: Date.now,
        minlength: 2,
        maxlength: 50
    },

    deleted_at:{
        type: Date,
        required: false,
        minlength: 2,
        maxlength: 50
    },

    password:{
        type: String,
        required: true,
        minlength: 8,
        maxlength: 1024
    }
});

userSchema.methods.generateAuthToken = function(){
    const token = jwt.sign({_id: this._id, role_id: this.role_id}, config.get('jwtPrivateKey'));

    return token;
};

const User = mongoose.model('User', userSchema);

function validateUser(user){
    const schema = {
        first_name: Joi.string().min(3).max(50).required(),
        last_name: Joi.string().min(5).max(50).required(),
        email: Joi.string().min(5).max(255).required(),
        password: Joi.string().min(8).max(255).required(),
    };

    return Joi.validate(user, schema);
} 

exports.User = User;
exports.validate = validateUser;
