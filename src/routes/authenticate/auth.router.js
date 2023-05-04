const express = require('express');
const router = express.Router();
const { login, logout, authenticateToken } = require('./auth.controller');

// Define a route that calls the "login" function.
router.post('/login', login);

// Define a route that calls the "logout" function.
router.post('/logout', authenticateToken, logout);

module.exports = router;