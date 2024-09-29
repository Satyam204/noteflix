const express = require('express');
const router = express.Router();
const Post = require('../server/models/Post');
const User = require('../server/models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // For generating a unique token

const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;

// Middleware to check if user is authenticated and verified
const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/admin/unauth');
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;

        // Find the user and check if they are verified
        const user = await User.findById(req.userId);
        if (!user || !user.isVerified) {
            return res.redirect('/admin/unauth');
        }
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.redirect('/admin/unauth');
    }
};

// Admin home route
router.get('/admin', (req, res) => {
    res.render('./admin/index', { layout: adminLayout });
});

// Admin dashboard route with authentication and verification check
router.get('/admin/dashboard', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const posts = await Post.find({ user: req.userId });

        res.render('./admin/dashboard', { user_name: user.username, user_id: req.userId, data: posts, layout: adminLayout });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Admin login route
router.post('/admin', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user || !user.isVerified) {
            return res.redirect('/admin/unauth');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.redirect('/admin/unauth');
        }

        const token = jwt.sign({ userId: user._id }, jwtSecret);
        res.cookie('token', token, { httpOnly: true });
        return res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// View single post route
router.get('/admin/post/:id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        res.render('./admin/post', { data: post, layout: adminLayout });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Edit post route
router.get('/admin/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        res.render('./admin/edit-post', { data: post, layout: adminLayout });
    } catch (error) {
        console.error('Error fetching post for editing:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Update post route
router.put('/admin/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            author: req.body.author,
            body: req.body.body,
            updatedAt: Date.now(),
        });
        return res.redirect(`/admin/post/${req.params.id}`);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Delete post route
router.delete('/admin/delete-post/:id', authMiddleware, async (req, res) => {
    try {
        await Post.deleteOne({ _id: req.params.id });
        return res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Logout route
router.get('/admin/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin');
});

// User registration route
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            verificationToken,
            isVerified: false,
        });

        // Setup Nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Create a verification link
        const verificationLink = `https://noteflix.onrender.com/verify-email?token=${verificationToken}&userId=${user._id}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification',
            text: `Please click the following link to verify your email: ${verificationLink}`,
        };

        await transporter.sendMail(mailOptions);
        // res.status(201).json({ message: 'User created. Please check your email to verify your account.', user });
        res.render('admin/registration-success.ejs');
    } catch (error) {
        console.error('Error during registration:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'User already exists' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Email verification route
router.get('/verify-email', async (req, res) => {
    const { token, userId } = req.query;

    try {
        const user = await User.findById(userId);
        if (!user || user.verificationToken !== token) {
            return res.status(400).send('Invalid verification link.');
        }

        user.isVerified = true;
        user.verificationToken = null; // Clear the token
        await user.save();

        res.render('admin/verification-success.ejs');
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Add post route
router.get('/admin/add-post', authMiddleware, (req, res) => {
    res.render('admin/add-post', { user_id: req.userId });
});

// Post creation route
router.post('/admin/add-post', authMiddleware, async (req, res) => {
    const { title, author, body, publish } = req.body;

    try {
        const newPost = new Post({
            title,
            author,
            body,
            user: req.userId, // Use the user ID from the authenticated user
            public: publish === 'true',
            createdAt: Date.now(),
        });

        await newPost.save();
        return res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Error adding new post:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
