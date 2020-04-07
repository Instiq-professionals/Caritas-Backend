const Joi = require('joi');
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema ({
    _id:{
        type: String
    },
    
    role:{
        type: String,
        required: true,
        unique: true
    },

    created_by:{
        type: String,
    },

    created_at:{
        type: Date,
        default: Date.now
    },

    updated_at:{
        type: Date,
        default: Date.now
    },

    deleted_at:{
        type: Date,
    },

    deleted_by:{
        type: String,
    },
});

const Role = mongoose.model('Role', roleSchema);

function validateRole(role){
    const schema = {
        role: Joi.string().required()
    };

    return Joi.validate(role, schema);
} 

exports.Role = Role;
exports.validate = validateRole;
