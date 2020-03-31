const mongoose = require('mongoose');

const newsLetterSchema = new mongoose.Schema ({
    email:{
        type: String,
        required: true,
        minlength: 3,
        maxlength: 255,
        unique: true
    },

    isSubscribed:{
        type: Boolean,
        default: true
    },

    created_at:{
        type: Date,
        required: true,
        default: Date.now,
    },

    updated_at:{
        type: Date,
        required: true,
        default: Date.now,
    },

    deleted_at:{
        type: Date,
        required: false,
    }
});


const NewsLetter = mongoose.model('NewsLetter', newsLetterSchema);
exports.NewsLetter = NewsLetter;
