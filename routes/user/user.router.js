const express = require('express');
const router = express.Router();

const {
    createUser,
    getUserById,
    updateUser,
    deleteUserById,
    getUsers,
    getMaleUsers
} = require('./user.controller');

const { authenticateToken } = require('../login/login.controller');

// Define a route for getting all users.
router.get('/', authenticateToken, getUsers);

// Define a route for getting a user by ID.
router.get('/:id', authenticateToken, getUserById);

// Define a route for getting all male users.
router.get('/male', authenticateToken, getMaleUsers);

// Define a route for creating a new user.
router.post('/', createUser);

// Define a route for updating a user by ID.
router.patch('/:id', authenticateToken, updateUser);

// Define a route for deleting a user by ID.
router.delete('/:id', authenticateToken, deleteUserById);

module.exports = router;