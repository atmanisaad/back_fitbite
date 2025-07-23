const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/Post');


router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single post by ID
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CREATE new post
// UPDATE this route in routes/posts.js
router.post('/', async (req, res) => {
    try {
        const post = new Post({
            title: req.body.title,
            summary: req.body.summary,     // Changed from content
            image: req.body.image,         // Added
            category: req.body.category    // Added
        });

        const savedPost = await post.save();
        res.status(201).json(savedPost);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// UPDATE post by ID
router.put('/:id', async (req, res) => {
    try {
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json(updatedPost);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE post by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedPost = await Post.findByIdAndDelete(req.params.id);

        if (!deletedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json({ message: 'Post deleted successfully', post: deletedPost });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;