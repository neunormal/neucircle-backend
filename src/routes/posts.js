const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

// @route   GET /api/posts
// @desc    Get all posts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username fullName')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/posts/:id
// @desc    Get post by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username fullName')
      .populate({ path: 'comments', populate: { path: 'user', select: 'username' } });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/posts
// @desc    Create a post
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { content, image } = req.body;
    
    const post = new Post({
      user: req.userId,
      content,
      image,
    });
    
    await post.save();
    await post.populate('user', 'username fullName');
    
    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like/unlike a post
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const likeIndex = post.likes.indexOf(req.userId);
    
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.userId);
    }
    
    await post.save();
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/posts/:id/comment
// @desc    Comment on a post
// @access  Private
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const comment = new Comment({
      post: req.params.id,
      user: req.userId,
      text,
    });
    
    await comment.save();
    post.comments.push(comment._id);
    await post.save();
    
    await comment.populate('user', 'username');
    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
