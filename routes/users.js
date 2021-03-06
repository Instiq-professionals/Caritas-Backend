const auth = require('../middleware/auth');
const isAdminOrSuperAdmin = require('../middleware/isAdminOrSuperAdmin');
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const {User, validate, validatePassword} = require('../models/user');
const {NewsLetter} = require('../models/NewsletterSubscription');
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const mailer = require('../helpers/sendMail');
const multer = require("multer");


/*
=================================================================================
                        fetch all users  
=================================================================================
*/
router.get('/', [auth, isAdminOrSuperAdmin], async (req, res) => { 

  try{
      // get all causes
      const users = await User.find({deleted_at: null}).sort({created_at: 1}).select({
        _id: 1,
        first_name: 1,
        last_name: 1,
        email: 1,
        role: 1,
        address: 1,
        phone_number: 1,
        bank_name: 1,
        account_name: 1,
        account_number: 1,
        account_type: 1,
        photo: 1,
        isEmailVerified: 1
      });

      if(!users) return res.status(404).json({
          status: 'Not found',
          message: 'No users found.',
          data:[]
      });

      return res.status(200).json({
        success: true,
        message: "Users retrieved successfully",
        data: users
      });
    } catch (e) {
      console.log(e);
    }

});

/*
=================================================================================
                        User Registration
=================================================================================
*/
router.post('/register', async (req, res) => {
    try {
        // validate request data
        const { error } = validate(req.body);
        // if (error) return res.status(400).send();
        if(error) return res.status(400).json({
            status: 'Bad request',
            message: error.details[0].message,
            data:[]
        });

        //check if email already registered
        let user = await User.findOne({ email: req.body.email });
        // if (user) return res.status(400).send();
        if(user) return res.status(400).json({
            status: 'Bad request',
            message: 'This Email already exists in our database',
            data:[]
        });

        //generate a token
        const token = jwt.sign({email: req.body.email}, config.get('jwtPrivateKey'));

        //save data in the user table
        user = new User(_.pick(req.body, ['first_name', 'last_name', 'email', 'password', 'role', 'address', 'phone_number',
            'bank_name', 'account_number', 'account_type', 'account_name', 'verify_email_token', 'verify_email_token_expires_on']));
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user.verify_email_token = token;
        user.verify_email_token_expires_on = Date.now() + 86400000;  //expires in 24 hours

        await user.save();

        //save user email to newsletter document
        const email =  req.body.email;
        subscribeForNewsLetter(email);

        const link = 'http://'+ req.headers.host +'/users/verify_email/' + token;
        const subject = "Email Verification";
        const emailText = 'You are receiving this email because you (or someone else) recently created an account on http://www.qcare.ng with this email address. If it is you, kindly click on the link below to confirm your email address.' + 
                            link + '\n\n' + 'Please ignore this email if you did not create this account.';
        const htmlText = ` 
                            <p> You are receiving this email because you (or someone else) recently created an account on <a href="http://www.qcare.ng">www.qcare.ng</a> with this email address</p>
                            <p> If it is you, kindly click on the link below to confirm your email address. Please ignore this email if you did not create this account.</p> 
                            <a href = '${link}'> ${link}</a>
                        `;
        //send mail
        mailer({
            from: '"QCare" <info@qcare.ng>',
            to: user.email,
            subject: subject,
            text: emailText,
            html: htmlText
        });

        res.status(200).json({
            status: 'success',
            message: 'You have been registered!',
        data: _.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role', 'address', 'phone_number',
        'bank_name', 'account_number', 'account_type', 'account_name', 'isEmailVerified'])
        });

    } 
    catch (error) {
        console.log(error);
    }
});

/*
=================================================================================
                        Get User profile
================================================================================= */

router.get("/profile", auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
    //   console.log("Profile user id", req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "The user does not exist",
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "User retrieved successfully",
        data: _.pick(user, [
          "_id",
          "first_name",
          "last_name",
          "photo",
          "email",
          "role",
          "address",
          "phone_number",
          "bank_name",
          "account_number",
          "account_type",
          "account_name",
          "photo"
        ]),
      });
    } catch (e) {
      console.log(e);
    }
  });
  

  /*
=================================================================================
                    Update profile
=================================================================================
*/

//specify file name to store and storage location
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

//validate file mime type
const fileFilter = (req, file, cb) => {
  try {
    //reject file
    if (
      file.mimetype === "image/bmp" ||
      file.mimetype === "image/tiff" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/svg"
    ) {
      cb(null, true);
    } else {
      cb("Sorry, images of type, png, jpg or jpeg allowed", false);
    }
  } catch (error) {
    handleError(error, res);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10,
  },
  fileFilter: fileFilter,
});

const photoUpload = upload.fields([{ name: "photo", maxCount: 1 }]);

router.post("/profile/update", auth, photoUpload, async (req, res) => {
//   console.log("Let me see the file path", req.files.photo[0].path);
  try {
    let user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User was not found",
      });
    }
    let somethingChanged = false;
    if (req.body.first_name && req.body.first_name != user.first_name) {
      user.first_name = req.body.first_name;
      somethingChanged = true;
    }
    if (req.body.last_name && req.body.last_name != user.last_name) {
      user.last_name = req.body.last_name;
      somethingChanged = true;
    }
    // if (req.body.email && req.body.email != user.email) {
    //   user.email = req.body.email;
    //   somethingChanged = true;
    // }
    if (
      req.body.account_number &&
      req.body.account_number != user.account_number
    ) {
      user.account_number = req.body.account_number;
      somethingChanged = true;
    }
    if (req.body.account_name && req.body.account_name != user.account_name) {
      user.account_name = req.body.account_name;
      somethingChanged = true;
    }
    if (req.body.phone_number && req.body.phone_number != user.phone_number) {
      user.phone_number = req.body.phone_number;
      somethingChanged = true;
    }
    if (req.body.bank_name && req.body.bank_name != user.bank_name) {
      user.bank_name = req.body.bank_name;
      somethingChanged = true;
    }
    if (req.body.account_type && req.body.account_type != user.account_type) {
      user.account_type = req.body.account_type;
      somethingChanged = true;
    }
    if (req.body.address && req.body.address != user.address) {
      user.address = req.body.address;
      somethingChanged = true;
    }

    if (req.files.photo) {
      user.photo = req.files.photo[0].path;
      somethingChanged = true;
    }

    if (somethingChanged) {
      user.updated_at = Date.now();

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Profile updated successully",
      });
    } else {
      return res.status(206).json({
        success: false,
        message: "Nothing to update",
      });
    }
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
                        Get User by ID
================================================================================= */

router.get("/:id", [auth, isAdminOrSuperAdmin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
  //   console.log("Profile user id", req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "The user does not exist",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: _.pick(user, [
        "_id",
        "first_name",
        "last_name",
        "photo",
        "email",
        "role",
        "address",
        "phone_number",
        "bank_name",
        "account_number",
        "account_type",
        "account_name",
        "photo",
        "isEmailVerified"
      ]),
    });
  } catch (e) {
    console.log(e);
  }
});

/*
=================================================================================
                        Newsletter subscription
=================================================================================
*/

// subscribe to newsleter after user registration
async function subscribeForNewsLetter(email){
    let emailExists = await NewsLetter.findOne({ email: email });
    if (!emailExists){
        const newsLetterSubscription = new NewsLetter({
            email: email
        });
        await newsLetterSubscription.save();
    }
}

router.post('/newsletter_subscription', async (req, res) => {
    try{
        let emailExists = await NewsLetter.findOne({email: req.body.email});
        if(!emailExists){
            const subscribeUser = new NewsLetter({
                email: req.body.email
            });
            await subscribeUser.save();
        }
        res.status(200).json({
            status: 'success',
            message: 'You have been subscribed to our weekly newsletter',
            data: _.pick(emailExists, ['_id', 'email', 'isSubscribed'])
        });
    }catch(e){
        console.log(e);
    }
});
/*
=================================================================================
                        User Login
=================================================================================
*/

router.post('/login', async (req, res) => {
    try{
        const { error } = validateLogin(req.body);
        if (error) return res.status(400).json({
            status: 'Bad request',
            message: error.details[0].message,
            data:[]
        });

        let user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(400).json({
            status: 'Bad request',
            message: 'Invalid email or password',
            data:[]
        });

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(400).json({
            status: 'Bad request',
            message: 'Invalid email or password',
            data:[]
        });

        //generate a token
        const token = user.generateAuthToken();
        if (user.isEmailVerified == true) return res.header('x-auth-token', token).status(200).json({
            status: 'success',
            message: 'You have logged in successfully!',
           data: _.pick(user, ['_id',  'first_name', 'last_name', 'email', 'role', 'address', 'phone_number',
           'bank_name', 'account_number', 'account_type', 'account_name', 'isEmailVerified', 'photo'])
        });

        return res.status(206).json({
            status: 'Partial content',
            message: 'Please verify your email address',
           data: []
        });
    }catch(e){
        console.log(e);
    }
});


function validateLogin(req){
    const schema = {
        email: Joi.string().min(5).max(255).required(),
        password: Joi.string().min(8).max(255).required(),
    };

    return Joi.validate(req, schema);
}

/*
=================================================================================
                        Password reset endpoints
=================================================================================
*/

//                        forgot password endpoint
//=================================================================================
router.post('/forgot_password', async (req, res) => {
    try{
        
        let user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(400).json({
            status: 'Bad request',
            message: 'Sorry, this email does not exist in our records.',
            data:[]
        });

        //generate a token
        const token = user.generateAuthToken();
        //  let link = 'http://'+ req.headers.host +'/users/reset_password/' + token;
        
        //send mail
        let link = 'http://'+ req.headers.host +'/users/reset_password/' + token;
        const subject = "Password Reset";
        const emailText = 'You are receiving this email because you (or someone else) have requested to change your password. If it is you, kindly click on the link below to reset your password.' + 
                            link + '\n\n' + 'Please ignore this email if you did not request for a password reset.';
        const htmlText = ` 
                            <p> You are receiving this email because you (or someone else) have requested to change your password</p>
                            <p> If it is you, kindly click on the link below to reset your password. Please ignore this email if you did not request for a password reset.</p> 
                            <a href = '${link}'> ${link}</a>
                        `;
        //send mail
        mailer({
            from: '"QCare" <support.caritas@instiq.com>',
            to: req.body.email,
            subject: subject,
            text: emailText,
            html: htmlText
        });
        
        //save token to db
        user.password_reset_token = token;
        user.password_reset_token_expires_on = Date.now() + 3600000;  //expires in 1 hour
        user.updated_at = Date.now();
        await user.save();

        return res.status(200).json({
            status: 'Success',
            message: 'An email was sent to ' + user.email + ' please check your email and follow the instructions therein.',
            data:[]
        });

    }catch(e){
        console.log(e);
    }
});

//                        Reset password endpoint 
//=================================================================================
router.put('/update_password/:token', async (req, res) => {
    try {
        //validate request body
        const { error } = validatePassword(req.body);
        if (error) return res.status(400).json({
            status: 'Bad request',
            message: error.details[0].message,
            data:[]
        });

        //check if token exits on the database or if token has expired
        let user = await User.findOne({ password_reset_token: req.params.token, password_reset_token_expires_on: {$gt: Date.now()} });
        if(!user) return res.status(400).json({
            status: 'Bad request',
            message: 'Invalid or expired token',
            data:[]
        });

        //update user password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
        user.password_reset_token = null;
        user.password_reset_token_expires_on = null;

        await user.save();

        //generate a token
        const token = user.generateAuthToken();

        res.header('x-auth-token', token).status(200).json({
            status: 'success',
            message: 'Your password has been changed successfully!',
        data: _.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role', 'address', 'phone_number',
        'bank_name', 'account_number', 'account_type', 'account_name', 'isEmailVerified'])
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
                        Email verification endpoints
=================================================================================
*/

//                        Generate verification token endpoint 
//=================================================================================
router.post('/generate_verification_token',auth, async (req, res) => {
    //get user
    let user = await User.findById(req.user._id);
    if(!user) return res.status(400).json({
        status: 'Bad request',
        message: 'No user found',
        data:[]
    });

    if(user.isEmailVerified == 1) return res.status(400).json({
        status: 'Bad request',
        message: 'You have verified your email address',
        data:[]
    });

    //generate a token
    const token = jwt.sign({email: user.email}, config.get('jwtPrivateKey'));
    user.verify_email_token = token;
    user.verify_email_token_expires_on = Date.now() + 86400000;  //expires in 24 hours

    await user.save();

    const link = 'http://'+ req.headers.host +'/users/verify_email/' + token;
    const subject = "Email Verification";
    const emailText = 'You are receiving this email because you (or someone else) recently created an account on http://www.qcare.ng with this email address. If it is you, kindly click on the link below to confirm your email address.' + 
                        link + '\n\n' + 'Please ignore this email if you did not create this account.';
    const htmlText = ` 
                        <p> You are receiving this email because you (or someone else) recently created an account on <a href="http://www.qcare.ng">www.qcare.ng</a> with this email address</p>
                        <p> If it is you, kindly click on the link below to confirm your email address. Please ignore this email if you did not create this account.</p> 
                        <a href = '${link}'> ${link}</a>
                    `;
    //send mail
    mailer({
        from: '"QCare" <info@qcare.ng>',
        to: user.email,
        subject: subject,
        text: emailText,
        html: htmlText
    });

    res.status(200).json({
        status: 'success',
        message: 'A new verification email has been sent to your email inbox.'+
                 'Please check your mail and follow the instructions therein to confirm your account',
       data:[]
    });
});


//                        Verify email endpoint 
//=================================================================================
router.put('/confirm_email/:token', async (req, res) => {

    //check if token exits on the database or if token has expired
    let user = await User.findOne({ verify_email_token: req.params.token, verify_email_token_expires_on: {$gt: Date.now()} });
    if(!user) return res.status(400).json({
        status: 'Bad request',
        message: 'Invalid or expired token',
        data:[]
    });

    //Verify email
    user.isEmailVerified = 1;
    user.verify_email_token = null;
    user.verify_email_token_expires_on = null;

    await user.save();

    //generate a token
    const token = user.generateAuthToken();

    res.header('x-auth-token', token).status(200).json({
        status: 'success',
        message: 'Your email has been verified successfully!',
       data: _.pick(user, ['_id', 'first_name', 'last_name', 'email', 'role', 'address', 'phone_number',
       'bank_name', 'account_number', 'account_type', 'account_name', 'isEmailVerified'])
    });
});

module.exports = router;