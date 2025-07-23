const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection




// Routes
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
app.use('/posts', postRoutes);
app.use('/users', userRoutes);




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});

mongoose.connect('mongodb+srv://saadatmani76:xpMm2VFrmCgLH0VH@cluster0.ezvwqo6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});