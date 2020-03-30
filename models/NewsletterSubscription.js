const mongoose = require('mongoose');

const NewsletterSchema = new mongoose.Schema ({
    email:{
        type: String,
        required: true,
        minlength: 3,
        maxlength: 255,
        unique: true
    },

    isSubscribed:{
        type: Boolean,
        required: true,
        minlength: 3,
        maxlength: 8,
        default: true
    },

    created_at:{
        type: Date,
        required: true,
        default: Date.now,
        minlength: 2,
        maxlength: 50
    },

    updated_at:{
        type: Date,
        required: true,
        default: Date.now,
        minlength: 2,
        maxlength: 50
    },

    deleted_at:{
        type: Date,
        required: false,
        minlength: 2,
        maxlength: 50
    }

});


const Newsletter = mongoose.model('Newsletter', NewsletterSchema);

exports.Newsletter = Newsletter;
