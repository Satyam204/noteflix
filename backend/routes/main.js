const express = require('express');
const router = express.Router();
const Post=require('../server/models/Post');
const { route } = require('./admin');

router.get('', async (req,res)=>{
      try {
    const data = await Post.find();
    res.render('index', { data });
  } catch (error) {
    console.log(error);
  } 
});

router.get('/post/:id', async (req, res) => {
  try {
    let slug = req.params.id;

    const data = await Post.findById({ _id: slug });
    
    res.render('post', {data});
  } catch (error) {
    console.log(error);
  }

});

router.get('/about',(req,res)=>{
    res.render('about');
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

router.get('/edit-post/:id', async (req, res) => {
  try {
    const data = await Post.findOne({ _id: req.params.id });
    res.render('edit-post',{data})
  } catch (error) {
    console.log(error);
  }

});
router.put('/edit-post/:id', async (req, res) => {
  try {

    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      author: req.body.author,
      body: req.body.body,
      updatedAt: Date.now()
    });

    res.redirect(`/post/${req.params.id}`);

  } catch (error) {
    console.log(error);
  }

});

router.delete('/delete-post/:id', async (req, res) => {

  try {
    await Post.deleteOne( { _id: req.params.id } );
    res.redirect('/');
  } catch (error) {
    console.log(error);
  }

});

router.get('/feedback',(req,res)=>
{
  try
  {
    res.render('feedback');
  }catch(error)
  {
    console.log(error)
  }
})



module.exports = router;
