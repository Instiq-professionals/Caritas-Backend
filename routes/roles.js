const auth = require('../middleware/auth');
const admin = require('../middleware/isAdmin');
const _ = require('lodash');
const {Role, validate} = require('../models/Role');
const express = require('express');
const router = express.Router();


/*
=================================================================================
                        Create Role Admin only
=================================================================================
*/
router.post('/create', [auth, admin], async (req, res) => {
    
    try{
        // validate request data
        const { error } = validate(req.body);
        if (error) return res.status(400).json({
            status: '400 Bad request',
            message: error.details[0].message,
            data:[]
        });

        //check if role has already been created
        let role = await Role.findOne({ role: req.body.role });
        if (role) return res.status(400).json({
            status: '400 Bad request',
            message: 'This Role already exists',
            data:[]
        });

        //save data in the role table
        role = new Role(_.pick(req.body, ['role', 'created_by']));
        role.created_by = req.user._id;

        await role.save();

        res.status(200).json({
            status: 'Success',
            message: 'The Role has been created successfully!',
            data:  _.pick(role, ['_id', 'role']),
        });

    }catch(e){
        console.log(e);
    }

});


module.exports = router;