const Joi = require('joi');
const mongoose = require('mongoose');

const successStorySchema = new mongoose.Schema ({
    cause_id:{
        type: String,
        required: true,
    },

    testimonial:{
        type: String,
        required: true,
    },

    created_by:{
        type: String
    },

    created_at:{
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

const SuccessStory = mongoose.model('SuccessStory', successStorySchema);

function validateStory(story){
    const schema = {
        testimonial: Joi.string().required(),
        cause_id: Joi.string().required(),
    };

    return Joi.validate(story, schema);
} 

exports.validate = validateStory;
exports.SuccessStory = SuccessStory;