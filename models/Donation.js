const Joi = require('joi');
const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema ({
    donor_id:{
        type: String,
        required: true,
    },

    cause_id:{
        type: String,
        required: true,
    },

    amount_donated:{
        type: Number,
        required: true,
    },
    
    donated_at:{
        type: Date,
        default: Date.now
    },

    updated_at:{
        type: Date,
        default: Date.now,
    },

    deleted_at:{
        type: Date,
        default: null,
    },

    deleted_by:{
        type: String,
        default: null,
    },
});

const Donation = mongoose.model('Donation', donationSchema);

function validateDonation(donation){
    const schema = {
        amount_donated: Joi.number().required(),
    };

    return Joi.validate(donation, schema);
} 

exports.Donation = Donation;
exports.validate = validateDonation;