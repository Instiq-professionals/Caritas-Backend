const Joi = require('joi');
const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema ({
    bank_name:{
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

const Bank = mongoose.model('Bank', bankSchema);

function validateBank(bank){
    const schema = {
        bank_name: Joi.string().required()
    };

    return Joi.validate(bank, schema);
} 

exports.Bank = Bank;
exports.validate = validateBank;
