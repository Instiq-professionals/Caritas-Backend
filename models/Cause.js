const Joi = require('joi');
const mongoose = require('mongoose');

const causeSchema = new mongoose.Schema ({
    topic:{
        type: String,
        required: true,
        minlength: 3,
    },

    description:{
        type: String,
        required: true,
        minlength: 20,
    },

    cause_photo:{
        type: String,
        required: true,
    },

    amount_required:{
        type: Number,
        required: true
    },

    category:{
        type: String,
        required: true
    },

    created_by:{
        type: String,
    },

    created_at:{
        type: Date,
        default: Date.now
    },

    isApproved:{
        type: Boolean,
    },
    
    approved_by:{
        type: String
    },

    approved_at:{
        type: Date
    },

    reason_for_disapproval:{
        type: String,
    },

    isVoted:{
        type: Boolean,
    },

    isResolved:{
        type: Boolean
    },

    marked_as_resolved_by:{
        type: String
    },

    resolved_at:{
        type: Date
    },

    updated_at:{
        type: Date,
        default: Date.now,
    },

    deleted_at:{
        type: Date,
    },

    deleted_by:{
        type: String,
    },
});

const Cause = mongoose.model('Cause', causeSchema);

function validateCause(cause){
    const schema = {
        topic: Joi.string().min(3).required(),
        description: Joi.string().min(20).required(),
        amount_required: Joi.number().required(),
        category: Joi.string().required(),
        // created_by: Joi.string().required()
    };

    return Joi.validate(cause, schema);
} 

exports.Cause = Cause;
exports.validate = validateCause;