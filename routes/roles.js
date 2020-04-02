const auth = require('../middleware/auth');
const _ = require('lodash');
const {Role, validate} = require('../models/Role');
const express = require('express');
const router = express.Router();

router.post('/', auth, async (req, res) => {
    
    try{
        // validate request data
        const { error } = validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        //check if email already registered
        let role = await Role.findOne({ role: req.body.role });
        if (role) return res.status(400).send('This Role already exists');

        //save data in the role table
        role = new Role(_.pick(req.body, ['role', 'created_by']));
        role.created_by = req.user._id;

        await role.save();

        res.send( _.pick(role, ['_id', 'role']));
    }catch(e){
        console.log(e);
    }

});


module.exports = router;