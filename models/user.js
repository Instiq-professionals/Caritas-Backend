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

    address:{
        type: String,
        required: true
    },

    phone_number:{
        type: String,
        required: true
    },

    bank_name:{
        type: String,
        required: true
    },

    account_number:{
        type: Number,
        required: true
    },

    account_name:{
        type: String,
        required: true
    },

    account_type:{
        type: String,
        required: true
    },

    role:{
        type: [String],
        required: true,
        default: ['User'],
    },

    isAVolunteer:{
        type: Boolean,
        default: false
    },

    isEmailVerified:{
        type: Boolean,
        default: false
    },

    created_by:{
        type: String,
        default: null
    },

    created_at:{
        type: Date,
        default: Date.now
    },

    updated_at:{
        type: Date,
        default: Date.now
    },

    deleted_at:{
        type: Date
    },

    password:{
        type: String,
        required: true,
        minlength: 8,
        maxlength: 1024
    },

    password_reset_token:{
        type: String
    },
    password_reset_token_expires_on:{
        type: Date
    },

    verify_email_token:{
        type: String
    },
    verify_email_token_expires_on:{
        type: Date
    }
});

userSchema.methods.generateAuthToken = function(){
    const token = jwt.sign({_id: this._id, role: this.role}, config.get('jwtPrivateKey'));

    return token;
};

const User = mongoose.model('User', userSchema);

function validateUser(user){
    const schema = {
        first_name: Joi.string().min(3).max(50).required(),
        last_name: Joi.string().min(5).max(50).required(),
        email: Joi.string().min(5).max(255).required(),
        password: Joi.string().min(8).max(255).required(),
        role: Joi.string(),
        address: Joi.string().required(),
        phone_number: Joi.string().required(),
        bank_name: Joi.string().required(),
        account_number: Joi.number().required(),
        account_type: Joi.string().required(),
        account_name: Joi.string().required(),
    };

    return Joi.validate(user, schema);
} 

function validatePassword(user){
    const schema = {
        password: Joi.string().min(8).max(255).required(),
    };

    return Joi.validate(user, schema);
}

exports.User = User;
exports.validate = validateUser;
exports.validatePassword = validatePassword;
