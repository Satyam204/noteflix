const express = require('express');
const router = express.Router();
const Post = require('../server/models/Post');
const User = require('../server/models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminLayout = '../views/layouts/admin'
const jwtSecret = process.env.JWT_SECRET;

const authMiddleware = (req, res, next ) => {
    const token = req.cookies.token;
  
    if(!token) {
        res.redirect('/admin/unauth');
    }
  
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.userId = decoded.userId;
      next();
    } catch(error) {
      res.redirect('/admin/unauth');
    }
  }


router.get('/admin', async (req, res) => {
    try {
        //const data = await Post.find();
        res.render('./admin/index', { layout: adminLayout });

    } catch (error) {
        console.log(error);
    }
});
router.get('/admin/dashboard',authMiddleware,async (req, res) => {
    try {
        const data = await Post.find();
        console.log("hello");
        res.render('./admin/dashboard', { data, layout: adminLayout });

    } catch (error) {
        console.log(error);
    }
});
router.get('/admin/unauth', async (req, res) => {
    try {

        res.render('./admin/unauth', { layout: adminLayout });

    } catch (error) {
        console.log(error);
    }
});


router.post('/admin', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await User.findOne( { username } );
  
      if(!user) {
        res.redirect('/admin/unauth');
      }
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if(!isPasswordValid) {
        res.redirect('/admin/unauth');
      }
  
      const token = jwt.sign({ userId: user._id}, jwtSecret );
      res.cookie('token', token, { httpOnly: true });
      res.redirect('/admin/dashboard');
  
    } catch (error) {
      console.log(error);
    }
  });

router.get('/admin/post/:id',authMiddleware, async (req, res) => {
    try {
        let slug = req.params.id;

        const data = await Post.findById({ _id: slug });

        res.render('./admin/post', { data , layout: adminLayout});
    } catch (error) {
        console.log(error);
    }

});

router.get('/admin/edit-post/:id', authMiddleware,async (req, res) => {
    try {
        const data = await Post.findOne({ _id: req.params.id });
        res.render('./admin/edit-post', { data , layout: adminLayout})
    } catch (error) {
        console.log(error);
    }

});
router.put('/admin/edit-post/:id', authMiddleware,async (req, res) => {
    try {

        await Post.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            author: req.body.author,
            body: req.body.body,
            updatedAt: Date.now()
        });

        res.redirect(`/admin/post/${req.params.id}`);

    } catch (error) {
        console.log(error);
    }

});



router.delete('/admin/delete-post/:id',authMiddleware, async (req, res) => {

    try {
        await Post.deleteOne({ _id: req.params.id });
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.log(error);
    }

});


router.get('/admin/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin');
  });

//Register

router.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
  
      try {
        const user = await User.create({ username, password:hashedPassword });
        res.status(201).json({ message: 'User Created', user });
      } catch (error) {
        if(error.code === 11000) {
          res.status(409).json({ message: 'User already in use'});
        }
        res.status(500).json({ message: 'Internal server error'})
      }
  
    } catch (error) {
      console.log(error);
    }
  });

module.exports = router;