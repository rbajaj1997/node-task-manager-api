const express = require('express');
const User = require('../models/user');
const router = new express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const {sendWelcomeMail, sendCancellationMail} = require('../emails/account');

// Add  a user
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        sendWelcomeMail(user.email, user.name);
        const token = await user.generateAuthTokens();
        res.send({ user, token });
    } catch (error) {
        res.status(400);
        res.send(error);
    }
})

// login a user
router.post('/user/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthTokens();
        res.send({ user, token });
    } catch (error) {
        res.status(400).send({ error });
    }
})

//Logout a user
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return req.token !== token.token;
        })
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
})

//Logout a user
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
})

// Find all users
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
})


//Update an user
router.patch('/user/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'email', 'password'];
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });
    if (!isValidOperation) {
        return res.status(404).send('Not Valid');
    }
    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update];
        });
        await req.user.save();
        // const user = await User.findByIdAndUpdate(id, req.body, {new: true, runValidators: true} );
        res.send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
})

//Delete an user
router.delete('/user/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancellationMail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (error) {
        res.status(500).send('Network Error');
    }
})


// Upload  a profile picture
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('File should be an image'));
        }
        cb(undefined, true);
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({
        width: 250,
        height: 250
    }).png().toBuffer();
     req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
})

//Delete the avatar image
router.delete('/users/me/avatar', auth, async (req, res) => {
    if (req.user.avatar) {
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    }
    res.status(400).send('No profile pic to delete');
})

//Get User Avatar
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error();
        }
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (error) {
        res.status(404).send();
    }
})


module.exports = router;