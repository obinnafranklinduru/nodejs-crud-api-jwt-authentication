const express = require('express');
const app = express();

const userRoutes = require('./routes/user/user.router');
const authRoutes = require('./routes/authenticate/auth.router');

// Middleware to parse incoming JSON data
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api', authRoutes);

module.exports = app;