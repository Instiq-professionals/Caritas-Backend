const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
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
// [auth, isAdmin]
router.post('/', auth, upload.single('cause_photo'), async (req, res) => { 

    try{
        
        // validate request data
        const { error } = validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);
        //save data in the user table
        cause = new Cause(_.pick(req.body, ['topic', 'description', 'cause_photo', 'amount_required', 'category', 'created_by']));
        cause.cause_photo = req.file.path;
        cause.created_by = req.user._id;

        await cause.save();

        res.send( _.pick(cause, ['_id', 'topic', 'description', 'cause_photo', 'amount_required', 'category']));
    
    }catch(e){
        console.log(e);
    }

});

// Edit cause for cause creator only
router.put('/edit/:id', auth, upload.single('cause_photo'), async (req, res) => {
    // get the cause by id supplied
    const cause = await Cause.findById(req.params.id);
    if(!cause) return res.status(404).send('No cause with the given ID was not found.');

    //check if user_id === cause creator
    if(cause.created_by !== req.user._id) return res.status(403).send('Access denied.');

    // validate request data
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    //save data in the user table
    cause.cause_photo = req.file.path;
    cause.topic = req.body.topic;
    cause.description = req.body.description;
    cause.amount_required = req.body.amount_required;
    cause.category = req.body.category;
    cause.updated_at = Date.now();

    res.send( _.pick(cause, ['_id', 'topic', 'description', 'cause_photo', 'amount_required', 'category']));
});

// Read all causes
router.put('/:id', auth, async (req, res) => {
    
    console.log(req.body._id);
});

// Read all causes (paginated)
router.put('/:id', auth, async (req, res) => {
    //check if user_id === cause creator
    console.log(req.body._id);
});

// Delete cause (soft delete)
router.put('/delete/:id', auth, async (req, res) => {
    console.log(req.body._id);
});

module.exports = router;