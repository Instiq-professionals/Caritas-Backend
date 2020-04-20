const config = require('config');
const nodemailer = require('nodemailer');

//send mail
const mail = async () =>{
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "mail.instiq.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
        user: "support.caritas@instiq.com",
        pass: config.get('emailPassword')
        },
        //use the following lines if you are testing the endpoint offline
        tls:{
            rejectUnauthorized:false
        }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Caritas" <support.caritas@instiq.com>', // sender address
        to: user.email, // list of receivers
        subject: "Email Verification", // Subject line
        text: 'You are receiving this email because you (or someone else) recently created an account on https://caritas.instiq.com with this email. If it is you, please click on the link below to confirm your email address.' + 
                link + '\n\n' + 'Please ignore this email if you did not create an account on https://caritas.instiq.com.',

        html: ` 
                <p> You are receiving this email because you (or someone else) recently created an account on https://caritas.instiq.com with this email</p>
                <p> If it is you, please click on the link below to confirm your email address. Please ignore this email if you did not create an account on https://caritas.instiq.com.</p> 
                <a href = '${link}'> ${link}</a>
             `

    });

    console.log("Message sent: %s", info.messageId);
};

mail().catch(console.error);
