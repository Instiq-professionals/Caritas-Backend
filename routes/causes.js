const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const isModerator = require('../middleware/isModerator');
const _ = require('lodash');
const {Cause, validate} = require('../models/Cause');
const {User} = require('../models/user');
const {Vote} = require('../models/Vote');
const {CauseFollowers} = require('../models/CauseFollower'); 
const express = require('express');
const router = express.Router();
const multer = require('multer');


/*
=================================================================================
                        fetch all causes for approval
=================================================================================
*/

router.get('/approve_causes',[auth, isModerator], async (req, res) => {
    try{
        // get all unapproved causes
        const cause = await Cause.find({deleted_at: null, approved_at: null}).sort({created_at: 1})
        .select({
            cause_title: 1,
            brief_description: 1, 
            charity_information: 1,
            additional_information: 1,
            cause_photos: 1, 
            cause_video: 1,
            amount_required: 1,
            category: 1,
            created_at: 1
        });

        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause found.',
        });

        return res.status(200).json({
            status: 'success',
            data:  cause,
        });

    }catch(e){
        console.log(e);
    }
});



/*
=================================================================================
                        Approve causes  
                        Problem: not getting req.body (its returning an empty array)
=================================================================================
*/

// router.put('/approve/:id', auth, isModerator, async (req, res) => {
//     try {
//         console.log(req.body);
//         // get the cause by id supplied
//         const cause = await Cause.findById(req.params.id);

//         if(cause == 0) return res.status(404).json({
//             status: 'Not found',
//             message: 'No cause with the given ID was not found.',
//         });

//         //update cause data
//         cause.isApproved = req.body.isApproved;
//         cause.approved_or_disapproved_by = req.user._id;
//         cause.approved_or_disapproved_at = Date.now();
//         cause.reason_for_disapproval = req.body.reason_for_disapproval;
//         cause.updated_at = Date.now();
//         await cause.save();

//         return res.status(200).json({
//             status: 'success',
//             message: 'The cause has been Approved/Disapproved!',
//             data: _.pick(cause, ['_id', 'cause_title', 'brief_description', 'charity_information','additional_information',
//                 'cause_photos', 'cause_video', 'amount_required', 'category', 'created_at'
//             ]),
//         });
//     } catch (error) {
//         console.log(error);
//     }
// });

/*
=================================================================================
                        Create Cause
=================================================================================
*/

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
    try {
        //reject file
        if (file.mimetype === 'image/png' || 
            file.mimetype === 'image/jpg' || 
            file.mimetype === 'image/jpeg' || 
            file.mimetype === 'image/svg' ||
            file.mimetype === 'video/mp4'){

            cb(null, true);
        }else{
            cb('Sorry, this form accepts only videos or images', false);
        }
    } catch (error) {
        handleError(error, res);
    }
};

const upload = multer({ 
    storage: storage,
    limits:{
        fileSize: 1024 * 1024 *10 
    },
    fileFilter: fileFilter,
});

// save cause
// [auth, isAdmin]
let causeMediaUpload = upload.fields([{ name: 'cause_photos', maxCount: 6 }, { name: 'cause_video', maxCount: 1 }]);

router.post('/create', auth, causeMediaUpload, async (req, res) => { 

    try{

        //validate request data
        const { error } = validate(req.body);
        if(error) return res.status(400).json({
            status: 'Bad request',
           message: error.details[0].message,
        });
        
        /*save data in the user table
         ============================
        */

        cause = new Cause(_.pick(req.body, [
            'cause_title', 'brief_description', 'charity_information','additional_information', 
            'account_number', 'accept_comments_and_reviews', 'watch_cause', 'cause_fund_visibility', 
            'share_on_social_media', 'cause_photos', 'cause_video', 'amount_required', 'category', 'created_by'
        ]));

        //Get cause_photo paths and store in an array
        const photos = req.files.cause_photos;
        const causePhotos = [];

        photos.forEach(photo => {
            causePhotos.push(photo.path);
        });

        cause.cause_photos = causePhotos;

        //check if request has video
        const checkForCauseVideo = req.files.cause_video == null;
        if(!checkForCauseVideo){
            if(req.files.cause_video[0].mimetype == 'video/mp4'){
                cause.cause_video = req.files.cause_video[0].path;
            }else{
                return res.status(400).json({
                    status: 'Bad request',
                    message: 'Cause_video must be a Video'
                });
            }
            
        }
        cause.created_by = req.user._id;
        

        await cause.save();

        return res.status(200).json({
            status: 'success',
            message: 'Your Cause has been successfully created!',
            data: _.pick(cause, ['_id', 'cause_title', 'brief_description', 'charity_information','additional_information',
                'cause_photos', 'cause_video', 'amount_required', 'category', 'created_at'
            ]),
        });
    
    }catch(e){
        console.log(e);
    }

});

/*
=================================================================================
                        fetch all causes by user
=================================================================================
*/
router.get('/my_causes', auth, async (req, res) => { 

    try{
        // get all causes
        const cause = await Cause.find({created_by: req.user._id, deleted_at: null})
        .sort({created_at: 1})
        .select({
            cause_title: 1,
            brief_description: 1, 
            charity_information: 1,
            additional_information: 1,
            cause_photos: 1, 
            cause_video: 1,
            amount_required: 1,
            category: 1,
            created_at: 1
        });

        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause found.',
        });

        return res.status(200).json({
            status: 'success',
            message: 'Listing all the approved causes',
            data: cause
        });
    
    }catch(e){
        console.log(e);
    }

});


/*
=================================================================================
                        Edit cause for cause creator only
=================================================================================
*/

router.put('/edit/:id', auth, causeMediaUpload, async (req, res) => {
    try {
        // get the cause by id supplied
        const cause = await Cause.findById(req.params.id);

        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause with the given ID was not found.',
        });

        //check if user_id === cause creator
        if(cause.created_by !== req.user._id) return res.status(403).json({
            status: 'Access denied',
            message: "Sorry, you don't have permission to edit this resource",
        });

        //update cause data
        cause.cause_title = req.body.cause_title;
        cause.brief_description = req.body.brief_description;
        cause.charity_information = req.body.charity_information;
        cause.additional_information = req.body.additional_information;
        cause.account_number = req.body.account_number;
        cause.accept_comments_and_reviews = req.body.accept_comments_and_reviews;
        cause.watch_cause = req.body.watch_cause;
        cause.cause_fund_visibility = req.body.cause_fund_visibility;
        cause.share_on_social_media = req.body.share_on_social_media;

        //check if request has video
        const checkForCauseVideo = req.files.cause_video == null;
        if(!checkForCauseVideo){
            if(req.files.cause_video[0].mimetype == 'video/mp4'){
                cause.cause_video = req.files.cause_video[0].path;
            }else{
                return res.status(400).json({
                    status: 'Bad request',
                    message: 'Cause_video must be a Video'
                });
            }
            
        }
        cause.cause_video = null;

        //Get cause_photo paths and store in an array
        const photos = req.files.cause_photos;
        const causePhotos = [];

        photos.forEach(photo => {
            causePhotos.push(photo.path);
        });

        cause.cause_photos = causePhotos;
        
        cause.amount_required = req.body.amount_required;
        cause.category = req.body.category;
        cause.updated_at = Date.now();

        await cause.save();

        return res.status(200).json({
            status: 'success',
            message: 'The cause has been updated!',
            data: _.pick(cause, ['_id', 'cause_title', 'brief_description', 'charity_information','additional_information',
                'cause_photos', 'cause_video', 'amount_required', 'category', 'created_at'
            ]),
        });
    } catch (error) {
        console.log(error);
    }
});

/*
=================================================================================
                        Vote for cause
=================================================================================
*/

router.put('/vote/:id', auth, async (req, res) => {
    try {
        // get the cause by id supplied
        const cause = await Cause.findById(req.params.id);

        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause with the given ID was not found.',
        });

        //check if user has already voted
        const voted = await Vote.find({voter_id: req.user._id, cause_id: req.params.id});

        if(voted !== 0) return res.status(400).json({
            status: 'Bad request',
            message: "Sorry, you have already voted for this cause.",
        });

        //update cause data
        cause.number_of_votes += 1;      
        cause.updated_at = Date.now();
        await cause.save();

        //create new role on the voter's table
        const newVote = new Vote({
            voter_id: req.user._id,
            cause_id: req.params.id,
            voted_at: Date.now(),
            updated_at: Date.now(),
        });
        await newVote.save();

        //create new role on the voter's table
        const causeFollower = new CauseFollowers({
            user_id: req.user._id,
            cause_id: req.params.id,
            followed_at: Date.now(),
            updated_at: Date.now(),
        });
        await causeFollower.save();


        return res.status(200).json({
            status: 'success',
            message: 'Your vote has been recorded!',
            data: _.pick(cause, ['_id', 'cause_title', 'brief_description', 'charity_information','additional_information',
                'cause_photos', 'cause_video', 'amount_required', 'category', 'created_at'
            ]),
        });
    } catch (error) {
        console.log(error);
    }
});

/*
=================================================================================
                        fetch single cause
=================================================================================
*/

router.get('/:id', async (req, res) => {
    try{
        // get the cause by id supplied
        const cause = await Cause.findById(req.params.id);

        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause with the given ID was not found.',
        });

        return res.status(200).send({
            status: 'success',
            data:   _.pick(cause, ['_id', 'cause_title', 'brief_description', 'charity_information','additional_information',
                'cause_photos', 'cause_video', 'amount_required', 'category', 'created_at'
            ]),
        });

    }catch(e){
        console.log(e);
    }
});

/*
=================================================================================
                        fetch all approved causes
=================================================================================
*/

router.get('/', async (req, res) => {
    try{
        // get all causes
        const cause = await Cause.find({deleted_at: null, isApproved: 1}).sort({created_at: 1})
        .select({
            cause_title: 1,
            brief_description: 1, 
            charity_information: 1,
            additional_information: 1,
            cause_photos: 1, 
            cause_video: 1,
            amount_required: 1,
            category: 1,
            created_at: 1
        });

        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause found.',
        });

        return res.status(200).json({
            status: 'success',
            data:  cause,
        });

    }catch(e){
        console.log(e);
    }
});


/*
=================================================================================
                        Delete cause (soft delete) for cause creator only
=================================================================================
*/

router.delete('/delete/:id', auth, async (req, res) => {
    try{
        // get the cause by id supplied
        const cause = await Cause.findById(req.params.id);

        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause with the given ID was found.',
        });

        //check if user_id === cause creator
        if(cause.created_by !== req.user._id) return res.status(403).json({
            status: 'Access denied.',
            message: "Sorry you don't have permission to delete this file",
        });

        //update cause data
        cause.updated_at = Date.now();
        cause.deleted_by = req.user._id;
        cause.deleted_at = Date.now();
        cause.save();

        return res.status(200).json({
            status: 'success',
            message: 'The Cause has been successfully deleted!',
        });

    }catch(e){
        console.log(e);
    }
});

/*
=================================================================================
                        List causes by category
=================================================================================
*/

// fetch all health
router.get('/category/health', async (req, res) => {
    try{
        // get all causes
        const cause = await Cause.find({deleted_at: null, isApproved: true, category: 'Health'}).sort({created_at: 1}).select({
            cause_title: 1,
            brief_description: 1, 
            charity_information: 1,
            additional_information: 1,
            cause_photos: 1, 
            cause_video: 1,
            amount_required: 1,
            category: 1,
            created_at: 1
        });

        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause found in this category.',
        });

        return res.status(200).json({
            status: 'success',
           data: cause,
        });

    }catch(e){
        console.log(e);
    }
});

// fetch all Human Right
router.get('/category/human_right', async (req, res) => {
    try{
        // get causes
        const cause = await Cause.find({deleted_at: null, isApproved: true, category: 'Human Right'}).sort({created_at: 1}).select({
            cause_title: 1,
            brief_description: 1, 
            charity_information: 1,
            additional_information: 1,
            cause_photos: 1, 
            cause_video: 1,
            amount_required: 1,
            category: 1,
            created_at: 1
        });
        // if(!cause) return res.status(404).send('No cause found.');
        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause found in this category.',
        });

        return res.status(200).json({
            status: 'success',
           data: cause,
        });

    }catch(e){
        console.log(e);
    }
});

// fetch all Food
router.get('/category/food', async (req, res) => {
    try{
        // get causes
        const cause = await Cause.find({deleted_at: null, isApproved: true, category: 'Food'}).sort({created_at: 1}).select({
            cause_title: 1,
            brief_description: 1, 
            charity_information: 1,
            additional_information: 1,
            cause_photos: 1, 
            cause_video: 1,
            amount_required: 1,
            category: 1,
            created_at: 1
        });
        // if(!cause) return res.status(404).send('No cause found.');
        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause found in this category.',
        });

        return res.status(200).json({
            status: 'success',
           data: cause,
        });

    }catch(e){
        console.log(e);
    }
});

// fetch all Education
router.get('/category/education', async (req, res) => {
    try{
        // get causes
        const cause = await Cause.find({deleted_at: null, isApproved: true, category: 'Education'}).sort({created_at: 1}).select({
            cause_title: 1,
            brief_description: 1, 
            charity_information: 1,
            additional_information: 1,
            cause_photos: 1, 
            cause_video: 1,
            amount_required: 1,
            category: 1,
            created_at: 1
        });

        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause found in this category.',
        });

        return res.status(200).json({
            status: 'success',
           data: cause,
        });

    }catch(e){
        console.log(e);
    }
});

module.exports = router;