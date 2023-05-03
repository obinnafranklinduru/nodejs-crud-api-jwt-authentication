const express = require('express');
const router = express.Router();
const { login, logout, getRefreshToken } = require('./auth.controller');

// Define a route that calls the "login" function.
router.post('/login', login);

// Define a route that calls the "logout" function.
router.post('/logout', logout);

// Define a route that calls the "getRefreshToken" function.
router.post('/token', getRefreshToken);

module.exports = router;