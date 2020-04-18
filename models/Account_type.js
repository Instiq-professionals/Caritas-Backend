const Joi = require('joi');
const mongoose = require('mongoose');

const accountTypeSchema = new mongoose.Schema ({
    account_type:{
        type: String,
        required: true,
        unique: true
    },

    created_by:{
        type: String,
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
        type: Date,
    },

    deleted_by:{
        type: String,
    },
});

const AccountType = mongoose.model('AccountType', accountTypeSchema);

function validateAccountType(account_type){
    const schema = {
        account_type: Joi.string().required()
    };

    return Joi.validate(account_type, schema);
} 

exports.AccountType = AccountType;
exports.validate = validateAccountType;
