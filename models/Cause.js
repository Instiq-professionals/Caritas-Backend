const Joi = require('joi');
const mongoose = require('mongoose');

const causeSchema = new mongoose.Schema ({
    cause_title:{
        type: String,
        required: true,
    },

    brief_description:{
        type: String,
        required: true,
    },

    account_number:{
        type: Number,
    },

    charity_information:{
        type: String,
        required: true,
    },

    additional_information:{
        type: String,
        required: true,
    },

    accept_comments_and_reviews:{
        type: Boolean,
        default: true
    },

    watch_cause:{
        type: Boolean,
        default: true
    },

    cause_fund_visibility:{
        type: Boolean,
        default: true
    },

    share_on_social_media:{
        type: Boolean,
        default: true
    },

    cause_photos:{
        type: [String],
        required: true,
    },

    cause_video:{
        type: String,
        required: true,
    },

    amount_required:{
        type: Number,
        required: true
    },

    number_of_votes:{
        type: Number,
        default: 0
    },

    amount_donated:{
        type: Number,
        default: 0
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
        default: false,
    },
    
    approved_or_disapproved_by:{
        type: String,
        default: null,
    },

    approved_or_disapproved_at:{
        type: Date,
        default: null,
    },

    reason_for_disapproval:{
        type: String,
        default: null,
    },

    isVoted:{
        type: Boolean,
        default: false,
    },

    isResolved:{
        type: Boolean,
        default: false,
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
        cause_title: Joi.string().required(),
        brief_description: Joi.string().required(),
        charity_information: Joi.string().required(),
        additional_information: Joi.string(),
        account_number: Joi.number(),
        accept_comments_and_reviews: Joi.boolean(),
        watch_cause: Joi.boolean(),
        cause_fund_visibility: Joi.boolean(),
        share_on_social_media: Joi.boolean(),
        amount_required: Joi.number().required(),
        number_of_votes: Joi.number(),
        amount_donated: Joi.number(),
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
        deleted_at: Joi.string(),
        deleted_by: Joi.string(),
    };

    return Joi.validate(cause, schema);
} 

exports.Cause = Cause;
exports.validate = validateCause;