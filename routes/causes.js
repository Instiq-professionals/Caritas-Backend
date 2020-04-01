const auth = require('../middleware/auth');
const _ = require('lodash');
const {Cause, validate} = require('../models/Cause');
const express = require('express');
const router = express.Router();
const multer = require('multer');

//specify file name to store and storage location
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname );
    }
});
   
//validate file mime type
const fileFilter = (req, file, cb) => {
    //reject file
    if (file.mimetype === 'image/png' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/jpeg' || 
        file.mimetype === 'image/svg'){

        cb(null, true);
    }else{
        cb('Please upload an image', false);
    }
};

const upload = multer({ 
    storage: storage,
    limits:{
        fileSize: 1024 * 1024 *10 
    },
    fileFilter: fileFilter,
});
//const upload = multer({dest: 'uploads/'});

// create cause
router.post('/', auth, upload.single('cause_photo'), async (req, res) => { 

    // validate request data
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    //save data in the user table
    cause = new Cause(_.pick(req.body, ['topic', 'description', 'cause_photo', 'amount_required']));
    cause.cause_photo = req.file.path;
    await cause.save();
    
    res.send( _.pick(cause, ['_id', 'topic', 'description', 'cause_photo', 'amount_required']));

});

// Edit cause
router.put('/:id', auth, async (req, res) => {
    console.log(req.body._id);
});

// Delete cause (soft delete)
router.put('/:id', auth, async (req, res) => {
    //check if user_id === cause creator
    console.log(req.body._id);
});

// Delete cause (soft delete)
router.put('/delete/:id', auth, async (req, res) => {
    console.log(req.body._id);
});

module.exports = router;