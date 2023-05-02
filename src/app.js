const express = require('express');
const app = express();
const userRoutes = require('./routes/user/user.router');
const loginRoutes = require('./routes/authenticate/auth.router');

// Middleware to parse incoming JSON data
app.use(express.json());

// Routes
app.use('/users', userRoutes);
app.use('/', loginRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal server error');
});

module.exports = app;