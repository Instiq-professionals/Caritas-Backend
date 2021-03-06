const auth = require('../middleware/auth');
const isModerator = require('../middleware/isModerator');
const _ = require('lodash');
const {Cause, validate} = require('../models/Cause');
const {User} = require('../models/user');
const {Vote} = require('../models/Vote');
const {Donation} = require('../models/Donation');
const {CauseFollowers} = require('../models/CauseFollower'); 
const express = require('express');
const router = express.Router();
const multer = require('multer');
const mailer = require('../helpers/sendMail');
const jwt = require('jsonwebtoken');
const config = require('config');


/*
=================================================================================
                        fetch all causes for approval
=================================================================================
*/

router.get('/approve_causes',[auth, isModerator], async (req, res) => {
    try{
        //declare variables for different moderator roles
        const user = await User.findById(req.user._id);
        let role = user.role;
        const food = role.includes("Food");
        const education = role.includes("Education");
        const humanRight = role.includes("Human Right");
        const health = role.includes("Health");
        const sharedServices = role.includes("Shared Services");

        if(food){
            // get all causes on food
            const cause = await Cause.find({deleted_at: null, category: 'Food'}).sort({created_at: 1})
            .select({
                cause_title: 1,
                brief_description: 1, 
                charity_information: 1,
                additional_information: 1,
                cause_photos: 1, 
                cause_video: 1,
                amount_required: 1,
                category: 1,
                created_at: 1,
                amount_donated: 1,
                isApproved: 1,
                isResolved: 1,
                created_by:1
            });

            if(cause == 0) return res.status(404).json({
                status: 'Not found',
                message: 'No cause found.',
                data:[]
            });

            return res.status(200).json({
                status: 'success',
                data:  cause,
            });
        }

        if(education){
            // get all causes on food
            const cause = await Cause.find({deleted_at: null, category: 'Education'}).sort({created_at: 1})
            .select({
                cause_title: 1,
                brief_description: 1, 
                charity_information: 1,
                additional_information: 1,
                cause_photos: 1, 
                cause_video: 1,
                amount_required: 1,
                category: 1,
                created_at: 1,
                amount_donated: 1,
                isApproved: 1,
                isResolved: 1,
                created_by:1
            });

            if(cause == 0) return res.status(404).json({
                status: 'Not found',
                message: 'No cause found.',
                data:[]
            });

            return res.status(200).json({
                status: 'success',
                data:  cause,
            });
        }

        if(humanRight){
            // get all causes on food
            const cause = await Cause.find({deleted_at: null, category: 'Human Right'}).sort({created_at: 1})
            .select({
                cause_title: 1,
                brief_description: 1, 
                charity_information: 1,
                additional_information: 1,
                cause_photos: 1, 
                cause_video: 1,
                amount_required: 1,
                category: 1,
                created_at: 1,
                amount_donated: 1,
                isApproved: 1,
                isResolved: 1,
                created_by:1
            });

            if(cause == 0) return res.status(404).json({
                status: 'Not found',
                message: 'No cause found.',
                data:[]
            });

            return res.status(200).json({
                status: 'success',
                data:  cause,
            });
        }

        if(health){
            // get all causes on food
            const cause = await Cause.find({deleted_at: null, category: 'Health'}).sort({created_at: 1})
            .select({
                cause_title: 1,
                brief_description: 1, 
                charity_information: 1,
                additional_information: 1,
                cause_photos: 1, 
                cause_video: 1,
                amount_required: 1,
                category: 1,
                created_at: 1,
                amount_donated: 1,
                isApproved: 1,
                isResolved: 1,
                created_by:1
            });

            if(cause == 0) return res.status(404).json({
                status: 'Not found',
                message: 'No cause found.',
                data:[]
            });

            return res.status(200).json({
                status: 'success',
                data:  cause,
            });
        }

        if(sharedServices){
            // get all causes on food
            const cause = await Cause.find({deleted_at: null}).sort({created_at: 1})
            .select({
                cause_title: 1,
                brief_description: 1, 
                charity_information: 1,
                additional_information: 1,
                cause_photos: 1, 
                cause_video: 1,
                amount_required: 1,
                category: 1,
                created_at: 1,
                amount_donated: 1,
                isApproved: 1,
                isResolved: 1,
                created_by:1
            });

            if(cause == 0) return res.status(404).json({
                status: 'Not found',
                message: 'No cause found.',
                data:[]
            });

            return res.status(200).json({
                status: 'success',
                data:  cause,
            });
        }

        return res.status(404).json({
            status: 'Not found',
            message: 'No cause found.',
            data:[]
        });
        
    }catch(e){
        console.log(e);
    }
});



/*
=================================================================================
                        Approve causes  
=================================================================================
*/

router.put('/approve/:id', [auth, isModerator], async (req, res) => {
    try {
        // console.log(req.body);
        // get the cause by id supplied
        const cause = await Cause.findById(req.params.id);

        if(!cause) return res.status(404).json({
            status: 'Not found',
            message: 'No cause with the given ID was not found.',
            data:[]
        });

        //update cause data
        cause.isApproved = 1;
        cause.approved_or_disapproved_by = req.user._id;
        cause.approved_or_disapproved_at = Date.now();
        await cause.save();

        /** Email the user about the cause approval.
        ================================================= **/

        //fetch cause creator
        const user = await User.findById(cause.created_by);
        
        // declare email variables
        let email = user.email;
        const subject = "Your Cause - "+cause.cause_title +" has been Approved!";
        const emailText = 'Dear '+user.first_name+ ' , Congratulations!. Your Cause' +cause.cause_title+ ' has been approved for donation. Kindly log onto your account at www.qcare.ng to manage your Cause. We also encourage you to invite your friends to join the platform.';
        const htmlText = ` 
                            <p> Dear ${user.first_name},</p>
                            <p> Congratulations!. Your Cause "${cause.cause_title}" has been approved for donation.</p>
                            <p>Kindly log onto your account at <a href="http://www.qcare.ng">www.qcare.ng</a> to manage your Cause.</p>
                            <p>We also encourage you to invite your friends to join the platform.</p>
                        `;
        //send mail
        mailer({
            from: '"QCare.ng" <support.caritas@instiq.com>',
            to: email,
            subject: subject,
            text: emailText,
            html: htmlText
        });


        return res.status(200).json({
            status: 'success',
            message: 'The cause has been Approved!',
            data: _.pick(cause, ['_id', 'cause_title', 'brief_description', 'charity_information','additional_information',
                'cause_photos', 'cause_video', 'amount_required', 'category', 'created_at', 'share_on_social_media', 'number_of_votes', 
                'amount_donated', 'isApproved', 'reason_for_disapproval'
            ]),
        });
    } catch (error) {
        console.log(error);
    }
});

/*
=================================================================================
                        Disapprove causes  
=================================================================================
*/

router.put('/disapprove/:id', [auth, isModerator], async (req, res) => {
    try {
        // console.log(req.body);
        // get the cause by id supplied
        const cause = await Cause.findById(req.params.id);

        if(!cause) return res.status(404).json({
            status: 'Not found',
            message: 'No cause with the given ID was not found.',
            data:[]
        });

        //update cause data
        cause.isApproved = 0;
        cause.approved_or_disapproved_by = req.user._id;
        cause.approved_or_disapproved_at = Date.now();
        cause.reason_for_disapproval = req.body.reason_for_disapproval;
        await cause.save();

        /** Email the user about the cause disapproval.
        ================================================= **/

        //fetch cause creator
        const user = await User.findById(cause.created_by);
        
        // declare email variables
        const token = jwt.sign({_id: user._id}, config.get('jwtPrivateKey'));
        const link = 'http://'+req.headers.host+'/causes/my_cause/'+cause._id+'/'+token;

        user.view_disapproved_cause_token = token;
        await user.save();

        const email = user.email;
        const subject = "About your cause - " +cause.cause_title;
        const emailText = 'Hi '+user.first_name+ ","+"\n\nThank you so much for logging a cause on our platform!.\n\nWe have received a high number of applications (causes) in recent times and have reviewed causes similar to your cause. At this time, we are sad to inform you that although we understand your true intent and the proposed objective of your cause; We have decided to move forward with other causes whose objective urgently need our support at this time.\n\nKindly click on "+link+" to see why your cause was disapproved.\n\nThank you for your interest. We encourage you to remain on our platform and contribute to the selection process as we thrive to make an impact on people's lives.\n\nWarm regards\nTeam QCare." ;
        const htmlText = ` 
                            <p> Hi ${user.first_name},</p>
                            <p> Thank you so much for logging a cause on our platform!.</p>
                            <p>
                                We have received a high number of applications (causes) in recent times and have reviewed causes similar to your cause. 
                                At this time, we are sad to inform you that although we understand your true intent and the proposed objective of your cause; 
                                We’ve decided to move forward with other causes whose objective urgently need our support at this time.
                            </p>
                            <p>
                                Kindly click <a href="${link}">here</a> to see why your cause was disapproved.
                            </p>
                            <p>
                                Thank you for your interest. We encourage you to remain on our platform and contribute to the selection process as we thrive to make an impact on people's lives.
                            </p>
                            <p>Warm regards,</p>
                            <p>Team QCare.</p>
                        `;
        //send mail
        mailer({
            from: '"QCare.ng" <support.caritas@instiq.com>',
            to: email,
            subject: subject,
            text: emailText,
            html: htmlText
        });


        return res.status(200).json({
            status: 'success',
            message: 'The cause has been disapproved!',
            data: _.pick(cause, ['_id', 'cause_title', 'brief_description', 'charity_information','additional_information',
                'cause_photos', 'cause_video', 'amount_required', 'category', 'created_at', 'share_on_social_media', 'number_of_votes', 
                'amount_donated', 'isApproved', 'reason_for_disapproval'
            ]),
        });
    } catch (error) {
        console.log(error);
    }
});


/*
=================================================================================
                        View reason for disapproval Disapproved cause  
=================================================================================
*/
router.get('/my_causes/disapproved/:id/:token', async(req, res) =>{
    try{
        
        //check if token exists on users document
        const user = await User.findOne({view_disapproved_cause_token: req.params.token});

        if(!user) return res.status(403).json({
            status: 'Bad request',
            message: 'Invalid token',
            data:[]
        });

        // get the cause by id supplied
        const cause = await Cause.findById(req.params.id);

        if(!cause) return res.status(404).json({
            status: 'Not found',
            message: 'No cause with the given ID was not found.',
            data:[]
        });

        causeDetails = _.pick(cause, ['_id', 'cause_title', 'brief_description', 'charity_information','additional_information',
        'cause_photos', 'cause_video', 'amount_required', 'category', 'created_at', 'share_on_social_media', 'number_of_votes', 
        'amount_donated','isApproved', 'isResolved', 'reason_for_disapproval']);

        user.view_disapproved_cause_token = null;
        await user.save();

        return res.status(200).send({
            status: 'success',
            data: causeDetails
        });

    }catch(e){
        console.log(e.message);
    }
});
/*
=================================================================================
                        Resolve cause (Moderators only)
=================================================================================
*/
router.put('/resolve/:id', [auth, isModerator], async (req, res) => {
    try {
        const cause = await Cause.findById(req.params.id);
    
        //fetch cause creator
        const user = await User.findById(cause.created_by);

        // generate token
        const token = jwt.sign({_id: req.user._id, role: user.role}, config.get('jwtPrivateKey'));  

        cause.isResolved = 1;
        cause.marked_as_resolved_by = req.user._id;
        cause.resolved_at = Date.now();
        cause.success_story_token = token;
        cause.save(); 

        /** Email Notification to cause creator
        ================================================= **/

        // declare email variables
        const email = user.email;
        const link = 'http://'+ req.headers.host +'/users/success-story/create/'+token;
        const subject = "Your Cause - "+cause.cause_title +" has been Resolved!";
        const emailText = 'Dear '+user.first_name+ ' , Congratulations!. Your Cause' +cause.cause_title+ ' has been Resolved!. Kindly click on '+link+' to create a success story. We also encourage you to invite your friends to join the platform.';
        const htmlText = ` 
                            <p> Dear ${user.first_name},</p>
                            <p> <b>Congratulations!.</b> Your Cause "${cause.cause_title}" has been Resolved!.</p>
                            <p>Kindly click <a href="${link}">here </a> or login to your account at <a href="http://www.qcare.ng">www.qcare.ng</a> to create a success story.</p>
                            <p>We also encourage you to invite your friends to join the platform.</p>
                            <p>Stay safe</p>
                            <p>Team QCare</p>
                        `;
        //send mail
        mailer({
            from: '"QCare.ng" <support.caritas@instiq.com>',
            to: email,
            subject: subject,
            text: emailText,
            html: htmlText
        });

        /** Email Notification to Moderators
        ================================================= **/

        //find all users who are moderators and return their emails
        const category = cause.category;
        const moderators = await User.find({role: { $all: ['Moderator', category] }}).select({ email: 1 });
        let allModerators = [];
        moderators.forEach(moderator => {
            allModerators.push(moderator.email);
        });

        //get the person that resolved the cause
        const moderatorInCharge = await User.findById(req.user._id);
        //send mail
        mailer({
            from: '"QCare.ng" <support.caritas@instiq.com>',
            to: allModerators,
            subject: "A new Cause - "+cause.cause_title +" has been Resolved!",
            text: 'A new Cause '+cause.cause_title+ 'was resolved by '+moderatorInCharge.first_name+' '+moderatorInCharge.last_name+'. Kindly log into your account at http://www.qcare.ng to view.',
            html: `
                    <p>A new Cause ${cause.cause_title} was resolved by ${moderatorInCharge.first_name} ${moderatorInCharge.last_name}.</p>
                    <p>Kindly log into your account at <a href="http://www.qcare.ng">www.qcare.ng</a> to view.</p>
                    <p>Warm regards</p>
                `
        });


        return res.status(200).json({
            status: 'success',
            message: 'The cause has been Resolved!',
            data: _.pick(cause, ['_id', 'cause_title', 'brief_description', 'charity_information','additional_information',
                'cause_photos', 'cause_video', 'amount_required', 'category', 'created_at', 'share_on_social_media', 'number_of_votes', 
                'amount_donated', 'isApproved', 'reason_for_disapproval', 'isResolved'
            ]),
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
                       Test endpoint
=================================================================================
*/

/*
    This endpoint is solely for experimentation (for dev use only)
*/
router.post('/test',auth, async (req, res) => { 
    // const moderators = await User.find({role: 'Moderator' }).sort({created_at: 1}); //find all users who are moderators
    // const moderators = await User.find({role: { $all: ['Moderator'] }}).select({ email: 1 }); //find all users who are moderators and return their roles (used to find two roles simultaneously)
    // const token = jwt.sign({_id: req.user._id, role: req.user.role}, config.get('jwtPrivateKey')); 
    // let email = [];
    // moderators.forEach(moderator => {
    //     email.push(moderator.email);
    // });
    const moderatorInCharge = await User.findById(req.body.id);

    const moderators = await User.find({role: { $all: ['Moderator'] }}).select({ email: 1 });
    let allModerators = [];
    moderators.forEach(moderator => {
        allModerators.push(moderator.email);
    });
    return res.json({firstname: moderatorInCharge.first_name, lastname: moderatorInCharge.last_name});
});

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
           data:[]
        });
        
        /*save data in the user table
         ============================
        */

        cause = new Cause(_.pick(req.body, [
            'cause_title', 'brief_description', 'charity_information','additional_information', 
            'account_number', 'accept_comments_and_reviews', 'watch_cause', 'cause_fund_visibility', 
            'share_on_social_media', 'cause_photos', 'cause_video', 'amount_required', 'category', 'created_by'
        ]));

        //check if request has video
        const checkForCausePhoto = req.files.cause_photos == null;
        if(!checkForCausePhoto){
            //Get cause_photo paths and store in an array
            const photos = req.files.cause_photos;
            const causePhotos = [];

            photos.forEach(photo => {
                causePhotos.push(photo.path);
            });

            cause.cause_photos = causePhotos;
        }
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
        cause.created_by = req.user._id;
        

        await cause.save();

        /** Email all moderators that a new cause was created
        ================================================= **/

        //fetch all moderators and extract their email addresses
        const category = cause.category;
        const moderators = await User.find({role: { $all: ['Moderator', category] }}).select({ email: 1 });
        
        // declare email variables
        let email = [];

        //extract moderators email addresses
        moderators.forEach(moderator => {
            email.push(moderator.email);
        });

        //send mail
        // let link = 'http://'+ req.headers.host +'/users/reset_password/' + token;
        const subject = "A New Cause Was Created";
        const emailText = 'A new Cause '+cause.cause_title+ ' was created. Please log onto your account at http://www.qcare.ng to review.';
        const htmlText = ` 
                            <p> A new Cause ${cause.cause_title} was created. Please log onto your account at <a href="http://www.qcare.ng">www.qcare.ng</a> to review.</p>
                        `;
        //send mail
        mailer({
            from: '"QCare.ng" <support.caritas@instiq.com>',
            to: email,
            subject: subject,
            text: emailText,
            html: htmlText
        });

        return res.status(200).json({
            status: 'success',
            message: 'Your Cause has been successfully created!',
            data: _.pick(cause, ['_id', 'cause_title', 'brief_description', 'charity_information','additional_information',
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
            created_at: 1,
            share_on_social_media: 1,
            reason_for_disapproval: 1
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
            data:[]
        });

        //check if user has already voted
        const voted = await Vote.find({voter_id: req.user._id, cause_id: req.params.id});

        if(voted !== 0) return res.status(400).json({
            status: 'Bad request',
            message: "Sorry, you have already voted for this cause.",
            data:[]
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
                        Donate to a cause
                        Problem: not summing the amount_donated
=================================================================================
*/

router.put('/donate/:id',auth, async (req, res) => {
    try {
        
        // get the cause by id supplied
        const cause = await Cause.findById(req.params.id);

        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause with the given ID was not found.',
            data:[]
        });

        // console.log(req.body);
        //update cause data
        cause.amount_donated = cause.amount_donated + req.body.amount_donated;      
        cause.updated_at = Date.now();
        await cause.save();

        //create new role on the voter's table
        const donor = new Donation();
           
            //check if donor is registered
            const donorNotRegistered = req.user._id == null;
            if(!donorNotRegistered){
                donor.donor_id = req.user._id;
            }
            donor.cause_id = req.params.id;
            donor.donated_at = Date.now();
            donor.updated_at = Date.now();

        await donor.save();

        return res.status(200).json({
            status: 'success',
            message: 'Thank you for your donation!',
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
            data:[]
        });

        if(cause.created_by == req.user._id){
            causeDetails = _.pick(cause, ['_id', 'cause_title', 'brief_description', 'charity_information','additional_information',
                'cause_photos', 'cause_video', 'amount_required', 'category', 'created_at', 'share_on_social_media', 'number_of_votes', 
                'amount_donated','isApproved', 'isResolved', 'reason_for_disapproval']);

            let causeCreatorDetails = await User.findById(cause.created_by);
            causeCreatorDetails =  _.pick(causeCreatorDetails, '_id', 'first_name', 'last_name', 'email', 'address', 'phone_number',
                'bank_name', 'account_number', 'account_type', 'account_name' );

            return res.status(200).send({
                status: 'success',
                data: [causeDetails, causeCreatorDetails]
            });
        }
        
        causeDetails = _.pick(cause, ['_id', 'cause_title', 'brief_description', 'charity_information','additional_information',
        'cause_photos', 'cause_video', 'amount_required', 'category', 'created_at', 'share_on_social_media', 'number_of_votes', 
        'amount_donated','isApproved', 'isResolved']);

        let causeCreatorDetails = await User.findById(cause.created_by);
        causeCreatorDetails =  _.pick(causeCreatorDetails, '_id', 'first_name', 'last_name', 'email', 'address', 'phone_number',
        'bank_name', 'account_number', 'account_type', 'account_name' );

        return res.status(200).send({
            status: 'success',
            data: [causeDetails, causeCreatorDetails]
        });

    }catch(e){
        console.log(e.message);
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
            _id: 1,
            cause_title: 1,
            brief_description: 1, 
            charity_information: 1,
            additional_information: 1,
            cause_photos: 1, 
            cause_video: 1,
            amount_required: 1,
            category: 1,
            created_at: 1,
            share_on_social_media: 1,
            number_of_votes: 1, 
            amount_donated: 1,
            reason_for_disapproval: 1
        });

        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause found.',
            data:[]
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
            created_at: 1,
            share_on_social_media: 1,
            number_of_votes: 1, 
            amount_donated: 1
        });

        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause found in this category.',
            data:[]
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
            created_at: 1,
            share_on_social_media: 1,
            number_of_votes: 1, 
            amount_donated: 1
        });
        // if(!cause) return res.status(404).send('No cause found.');
        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause found in this category.',
            data:[]
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
            created_at: 1,
            share_on_social_media: 1,
            number_of_votes: 1, 
            amount_donated: 1
        });
        // if(!cause) return res.status(404).send('No cause found.');
        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause found in this category.',
            data:[]
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
            created_at: 1,
            share_on_social_media: 1,
            number_of_votes: 1, 
            amount_donated: 1
        });

        if(cause == 0) return res.status(404).json({
            status: 'Not found',
            message: 'No cause found in this category.',
            data:[]
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