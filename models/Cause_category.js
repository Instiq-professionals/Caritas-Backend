const Joi = require('joi');
const mongoose = require('mongoose');

const cause_categorySchema = new mongoose.Schema ({
    category_name:{
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

const Category = mongoose.model('Category', cause_categorySchema);

function validateCategory(category){
    const schema = {
        category_name: Joi.string().required()
    };

    return Joi.validate(category, schema);
} 

exports.Category = Category;
exports.validate = validateCategory;
