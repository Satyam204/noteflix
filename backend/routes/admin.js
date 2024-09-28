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
router.get('/admin/dashboard', authMiddleware, async (req, res) => {
  try {
    const user_id = req.userId; // Get logged-in user's ID from middleware

    // Find the user details using user_id
    const user = await User.findById(user_id); // Assuming you have the user's name stored in the User model
    const user_name = user.username; // Assuming 'username' is the field name in User schema

    // Find posts by the current user
    const data = await Post.find({ user: user_id }); // Assuming 'user' field in Post stores user ID

    // Render dashboard with the filtered data
    res.render('./admin/dashboard', { user_name, user_id, data, layout: adminLayout });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
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
router.get('/add-post', async (req, res) => {
  try {
    res.render('add-post');
  } catch (error) {
    console.log(error);
  }
});

router.post('/add-post', async (req, res) => {
  try {
    const newPost = new Post({
      title: req.body.title,
      author: req.body.author,
      body: req.body.body,
      user: req.body.userId
    });

    await Post.create(newPost);
    res.redirect('/');
  } catch (error) {
    console.log(error);
  }
});


//post adding

router.get('/admin/add-post', authMiddleware, async (req, res) => {
  try {
    const user_id = req.userId; // Retrieve user ID from the authenticated user
    res.render('admin/add-post', { user_id }); // Pass the user_id to the EJS template
  } catch (error) {
    console.log(error);
  }
});

router.post('/admin/add-post', authMiddleware, async (req, res) => {
  try {
    // Destructure fields from request body
    const { title, author, body, userId, publish } = req.body;
    console.log(publish);
    // Create new post with the appropriate fields
    const newPost = new Post({
      title: title,
      author: author,
      body: body,
      user: userId, // Use the user ID from the hidden input field
      public: publish === 'true' ? true : false, // Check if the 'publish' checkbox was checked
      createdAt: Date.now()
    });

    // Save the new post to the database
    await Post.create(newPost);

    // Redirect to the dashboard after the post is added
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});



module.exports = router;