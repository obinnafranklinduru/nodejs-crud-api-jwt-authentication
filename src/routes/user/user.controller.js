const jwt = require('jsonwebtoken');
require('dotenv').config()

const User = require('../../model/user.mongo');

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

        // Send a 201 (Created) and the user object as the response.
        res.status(201).send({user: user._id});
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
        if (!user) return res.status(404).json({ error: 'user not found' });

        // Send the user object as the response.
        res.send(user);
    } catch (error) {
        res.status(500).send(error);
    }
}

async function updateUser(req, res) {
    try {
        // Find the user by id
        const user = await User.findById(req.params.id);

        // If no user is found, return a 404 and an error message as the response.
        if (!user) return res.status(404).json({ error: 'user not found' });

        // Update the user properties if they exist in the request body
        if (req.body.name != null) {
            user.name = req.body.name;
        }
        if (req.body.email != null) {
            user.email = req.body.email;
        }
        if (req.body.password != null) {
            user.password = req.body.password;
        }

        // Save the updated user to the database
        const updatedUser = await user.save();

        // Return the updated user as the response
        res.json(updatedUser);
    } catch (error) {
        // If there is an error, handle it and return a 400 response with the error message(s)
        const errors = handleError(error);
        res.status(400).send({ errors });
    }
}

async function deleteUserById(req, res) {
    try {
        // Find the user with the specified ID using the findByIdAndDelete() method, 
        // which both finds and deletes the user object.
        const user = await User.findByIdAndDelete(req.params.id);

        // If no user is found, return a 404 and an error message as the response.
        if (!user) return res.status(404).send({ error: 'user not found' });

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