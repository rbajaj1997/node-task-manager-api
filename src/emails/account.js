const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeMail = (email, name) => {
    const msg = {
        to: email,
        from: 'rbajaj1402@gmail.com',
        subject: 'Welcome!',
        text: 'Welcome to the app, Let me know how you get along with the app'
    }
    sgMail.send(msg);
}

const sendCancellationMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'rbajaj1402@gmail.com',
        subject: 'Sorry!',
        text: `Hey, ${name}, it is sad to see you going. Please let us know how we can improve`,
    })
}

module.exports = {
    sendWelcomeMail,
    sendCancellationMail
}

