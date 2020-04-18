const mongoose = require('mongoose');

const successStorySchema = new mongoose.Schema ({
    user_id:{
        type: String,
        required: true,
    },

    cause_id:{
        type: String,
        required: true,
    },

    testimonial:{
        type: String,
        required: true,
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

exports.SuccessStory = SuccessStory;