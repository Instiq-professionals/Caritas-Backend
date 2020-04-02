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
        default: null,
    },

    created_at:{
        type: Date,
        default: Date.now
    },

    isApproved:{
        type: Boolean,
        default: null,
    },
    
    approved_by:{
        type: String,
        default: null,
    },

    approved_at:{
        type: Date,
        default: null,
    },

    reason_for_disapproval:{
        type: String,
        default: null,
    },

    isVoted:{
        type: Boolean,
        default: null,
    },

    isResolved:{
        type: Boolean,
        default: null,
    },

    marked_as_resolved_by:{
        type: String,
        default: null,
    },

    resolved_at:{
        type: Date,
        default: null,
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

const Cause = mongoose.model('Cause', causeSchema);

function validateCause(cause){
    const schema = {
        topic: Joi.string().min(3).required(),
        description: Joi.string().min(20).required(),
        amount_required: Joi.number().required(),
        category: Joi.string().required(),
        created_by: Joi.string(),
        created_at: Joi.string(),
        isApproved: Joi.boolean(),
        approved_by: Joi.string(),
        approved_at: Joi.string(),
        reason_for_disapproval: Joi.string(),
        isVoted: Joi.boolean(),
        isResolved: Joi.boolean(),
        marked_as_resolved_by: Joi.string(),
        resolved_at: Joi.string(),
        updated_at: Joi.string(),
        deleted_at: Joi.string(),
        deleted_by: Joi.string(),
    };

    return Joi.validate(cause, schema);
} 

exports.Cause = Cause;
exports.validate = validateCause;