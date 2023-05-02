const jwt = require('jsonwebtoken');
require('dotenv').config()

const User = require('../../model/user.mongo');
const { createToken } = require('../authenticate/auth.controller');

// Handle Errors
function handleError(err) {
    let errors = {};

    // duplicate key error
    if (err.code === 11000) {
        errors.email = 'email address already exists';
        return errors;
    }

    // validation errors
    if (err.message.includes('User validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message
        });
    }

    return errors;
}

async function createUser(req, res) {
    try {
        // Get the data from the request body.
        const { name, email, password, gender } = req.body;

        // Save user to the database using the create() method.
        const user = await User.create({ name, email, password, gender });

        const accessToken = createToken(user._id);

        // Send a 201 (Created) and the user object as the response.
        res.status(201).send({user: user._id, token: accessToken});
    } catch (error) {
        const errors = handleError(error);
        res.status(400).send({errors});
    }
}

async function getUserById(req, res) {
    try {
        // Find the user with the specified ID using the findById() method.
        const user = await User.findById(req.params.id);

        // If no user is found, return a 404 and an error message as the response.
        if (!user) {
            return res.status(404).json({ error: 'user not found' });
        }

        // Send the user object as the response.
        res.send(user);
    } catch (error) {
        res.status(500).send(error);
    }
}

async function updateUser(req, res) {
    // Get an array of the keys of the properties to be updated from the request body.
    const updates = Object.keys(req.body);

    // Define an array of the properties that are allowed to be updated.
    const allowedUpdates = ['name', 'email', 'password'];

    // Check that every property in the updates array is allowed to be updated.
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

     // If any of the properties are not allowed to be updated, send a 400 and an error message
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        // Find the user with the specified ID using the findById() method.
        const user = await User.findById(req.params.id);

        // If no user is found, return a 404 and an error message as the response.
        if (!user) {
            return res.status(404).send({ error: 'user not found' });
        }

        // Update each property of the user object with the new values from the request body.
        updates.forEach(update => (user[update] = req.body[update]));

        // Save the updated user object to the database.
        await user.save();

        res.send(user);
    } catch (error) {
        res.status(400).send(error);
    }
}

async function deleteUserById(req, res) {
    try {
        // Find the user with the specified ID using the findByIdAndDelete() method, 
        // which both finds and deletes the user object.
        const user = await User.findByIdAndDelete(req.params.id);

        // If no user is found, return a 404 and an error message as the response.
        if (!user) {
            return res.status(404).send({ error: 'user not found' });
        }

        res.send(user);
    } catch (error) {
        res.status(500).send(error);
    }
}

async function getUsers(req, res) {
    try {
        // to retrieve all the user objects from the  database.
        const users = await User.find({});

        // Send the retrieved user objects as the response.
        res.send(users);
    } catch (error) {
        res.status(500).send(error);
    }
}

async function getMaleUsers(req, res) {
    try {        
        // Retrieve all the user objects from the database whose "gender" property is set to "male".
        const users = await User.find({ gender: 'male' });
        
        res.send(users);
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
}

module.exports = {
    createUser,
    getUserById,
    updateUser,
    deleteUserById,
    getUsers,
    getMaleUsers
}