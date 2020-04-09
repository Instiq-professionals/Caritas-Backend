const mongoose = require('mongoose');

const causeFollowerSchema = new mongoose.Schema ({
    cause_id:{
        type: String,
        required: true,
    },

    
    followed_at:{
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

const CauseFollowers = mongoose.model('CauseFollowers', causeFollowerSchema);

exports.CauseFollowers = CauseFollowers;