const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret (put this in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// IMPORTANT: Put specific routes BEFORE parameterized routes

// Register new user (specific route)
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
        });

        const savedUser = await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: savedUser._id, email: savedUser.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return user data without password
        const userResponse = {
            _id: savedUser._id,
            name: savedUser.name,
            email: savedUser.email,
        };

        res.status(201).json({
            message: 'User registered successfully',
            user: userResponse,
            token
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login user (specific route)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt for:', email); // Debug log

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email); // Debug log
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('Invalid password for:', email); // Debug log
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return user data without password
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
        };

        console.log('Login successful for:', email); // Debug log

        res.json({
            message: 'Login successful',
            user: userResponse,
            token
        });
    } catch (error) {
        console.error('Login error:', error); // Debug log
        res.status(500).json({ error: error.message });
    }
});

// Protected route - get current user profile (specific route)
router.get('/profile/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all users (specific route)
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Exclude password
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create user (admin only - specific route)
router.post('/', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = new User({
            name,
            email,
            password: hashedPassword,
        });

        const savedUser = await user.save();

        // Return user without password
        const userResponse = {
            _id: savedUser._id,
            name: savedUser.name,
            email: savedUser.email,
        };

        res.status(201).json(userResponse);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PARAMETERIZED ROUTES COME LAST

// Get user by ID (parameterized route - comes after specific routes)
router.get('/:id', async (req, res) => {
    try {
        console.log('Getting user by ID:', req.params.id); // Debug log

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const user = await User.findById(req.params.id).select('-password'); // Exclude password
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error); // Debug log
        res.status(500).json({ error: error.message });
    }
});

// Delete user (parameterized route)
router.delete('/:id', async (req, res) => {
    try {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully', user: deletedUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Middleware to verify JWT token
function verifyToken(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
}

module.exports = router;