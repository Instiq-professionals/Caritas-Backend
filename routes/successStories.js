const auth = require('../middleware/auth');
const _ = require('lodash');
const {Cause} = require('../models/Cause');
const {SuccessStory, validate} = require('../models/SuccessStory');
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('config');


/*
=================================================================================
                        fetch all success stories
=================================================================================
*/

router.get('/', async (req, res) => {
    try{
        // get all success stories
        const stories = await SuccessStory.find({deleted_at: null}).sort({created_at: 1})
        .select({
            cause_id: 1,
            testimonial: 1, 
            created_by: 1,
            created_at: 1,
        });        

        if(stories == null) return res.status(404).json({
            status: 'Not found',
            message: 'No cause found.',
            data:[]
        });

        return res.status(200).json({
            status: 'success',
            data:  stories,
        });

    }catch(e){
        console.log(e);
    }
});




/*
=================================================================================
                        Create Success a story
=================================================================================
*/

router.post('/create', auth, async (req, res) => { 

    try{
        // get the cause by id supplied
        const cause = await Cause.findById(req.body.cause_id);

        if(cause == null) return res.status(404).json({
            status: 'Not found',
            message: 'No cause with the given ID was not found.',
            data:[]
        });

        //check if user_id === cause creator
        if(cause.created_by !== req.user._id) return res.status(403).json({
            status: 'Access denied',
            message: "Sorry, you don't have permission to write a success story for this cause",
            data:[]
        });

        //check if success story has been created for a cause
        const storyExist = await SuccessStory.find({cause_id: cause._id});
        if(storyExist) return res.status(400).json({
            status: 'Bad request',
            message: "Success story already exists for this cause",
            data:[]
        });

        //validate request data
        const { error } = validate(req.body);
        if(error) return res.status(400).json({
            status: 'Bad request',
           message: error.details[0].message,
           data:[]
        });
        
        /*save data in the user table
         ============================
        */

        story = new SuccessStory(_.pick(req.body, [
            'cause_id', 'testimonial', 'created_at', 'created_by'
        ]));
        story.created_by = req.user._id;
        

        await story.save();

        return res.status(200).json({
            status: 'success',
            message: 'Your story has been recorded successfully!',
            data: _.pick(cause, ['_id', 'cause_id', 'testimonial', 'created_at', 'created_by']),
        });
    
    }catch(e){
        console.log(e);
    }

});

/*
=================================================================================
                        create success story from email link
=================================================================================
*/
router.post('/create/:token', async (req, res) => {
    try {

        const token = req.params.token;

        //check if token exits on the database or if token has expired
        let cause = await Cause.findOne({ success_story_token: token });

        if(!cause) return res.status(400).json({
            status: 'Bad request',
            message: 'Invalid token',
            data:[]
        });

        //decode token
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        req.user = decoded;

        //check if user_id === cause creator
        if(cause.created_by !== req.user._id) return res.status(403).json({
            status: 'Access denied',
            message: "Sorry, you don't have permission to write a success story for this cause",
            data:[]
        });
        
        /*save data in the user table
         ============================
        */

        story = new SuccessStory(_.pick(req.body, [
            'cause_id', 'testimonial', 'created_at', 'created_by'
        ]));
        story.created_by = req.user._id;
        story.cause_id = cause._id;         

        await story.save();

        //set delete success_story_token
        cause.success_story_token = null;
        await cause.save();

        return res.status(200).json({
            status: 'success',
            message: 'Your story has been recorded successfully!',
            data: _.pick(cause, ['_id', 'cause_id', 'testimonial', 'created_at', 'created_by']),
        });

    } catch (e) {
        console.log(e);
        return res.status(500).json({
        success: false,
        message: "An error occurred while processing your request," + e.message,
        });
    }
});


/*
=================================================================================
                        fetch all success stories by user
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
            data:[]
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
                        Edit success story for success story creator only
=================================================================================
*/

router.put('/edit/:id', auth, async (req, res) => {
    try {
        // get the cause by id supplied
        const cause = await Cause.findById(req.params.id);

        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause with the given ID was not found.',
            data:[]
        });

        //check if user_id === cause creator
        if(cause.created_by !== req.user._id) return res.status(403).json({
            status: 'Access denied',
            message: "Sorry, you don't have permission to edit this cause",
            data:[]
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
                    message: 'Cause_video must be a Video',
                    data:[]
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
            'cause_photos', 'cause_video', 'amount_required', 'category', 'created_at', 'share_on_social_media', 'number_of_votes', 
            'amount_donated'
            ]),
        });
    } catch (error) {
        console.log(error);
    }
});

/*
=================================================================================
                        fetch single success story
=================================================================================
*/

router.get('/:id', async (req, res) => {
    try{
        // get the cause by id supplied
        const cause = await Cause.findById(req.params.id);

        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause with the given ID was not found.',
            data:[]
        });

        return res.status(200).send({
            status: 'success',
            data:   _.pick(cause, ['_id', 'cause_title', 'brief_description', 'charity_information','additional_information',
                'cause_photos', 'cause_video', 'amount_required', 'category', 'created_at', 'share_on_social_media', 'number_of_votes', 
                'amount_donated'
            ]),
        });

    }catch(e){
        console.log(e);
    }
});

/*
=================================================================================
            Delete success story (soft delete) for success story creator only
=================================================================================
*/

router.delete('/delete/:id', auth, async (req, res) => {
    try{
        // get the cause by id supplied
        const cause = await Cause.findById(req.params.id);

        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause with the given ID was found.',
            data:[]
        });

        //check if user_id === cause creator
        if(cause.created_by !== req.user._id) return res.status(403).json({
            status: 'Access denied.',
            message: "Sorry you don't have permission to delete this file",
            data:[]
        });

        //update cause data
        cause.updated_at = Date.now();
        cause.deleted_by = req.user._id;
        cause.deleted_at = Date.now();
        cause.save();

        return res.status(200).json({
            status: 'success',
            message: 'The Cause has been successfully deleted!',
            data:[]
        });

    }catch(e){
        console.log(e);
    }
});

module.exports = router;