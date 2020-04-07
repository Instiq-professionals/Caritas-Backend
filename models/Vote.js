const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema ({
    _id:{
        type: String
    },
    
    voter_id:{
        type: String,
        required: true,
    },

    cause_id:{
        type: String,
        required: true,
    },

    
    voted_at:{
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

const Vote = mongoose.model('Vote', voteSchema);

exports.Vote = Vote;