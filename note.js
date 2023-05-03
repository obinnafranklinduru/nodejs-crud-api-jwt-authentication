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

async function register(req, res) {
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
        res.status(200).send(user);
    } catch (error) {
        res.status(401).send(error);
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
        res.status(200).json(updatedUser);
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

        res.status(204).send(user);
    } catch (error) {
        res.status(500).send(error);
    }
}

async function getUsers(req, res) {
    try {
        // to retrieve all the user objects from the  database.
        const users = await User.find({});

        // Send the retrieved user objects as the response.
        res.status(200).send(users);
    } catch (error) {
        if (error.name === 'UnauthorizedError') {
            res.status(401).json({ message: 'Unauthorized' });
        } else {
            res.status(500).send(error);
        }
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

const jwt = require('jsonwebtoken');
require('dotenv').config()

const Token = require('../../model/token.mongo');
const User = require('../../model/user.mongo');

function generateAccessToken(user) {
    return jwt.sign(user, process.env.JWT_SECRET_ACCESS_TOKEN, {expiresIn: '100s'});
}

// Handle refresh token
function getRefreshToken(req, res) {
    const refreshToken = req.body.token
    if (!refreshToken) return res.status(404).send({ error: 'refresh token is required' });

    const token = Token.findOne({ token: refreshToken });
    if (!token) return res.status(403).send({ error: 'token not found' });

    jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH_TOKEN, (err, user) => {
        if (err) return res.status(403).json({ error: err.message });
        
        const accessToken = generateAccessToken({ _id: user._id })

        res.status(200).header('Authorization', accessToken)
            .json({ accessToken: accessToken })
    })
}

// Handle user login request
async function login(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        // Check if user with given email exists in database
        if (!user) return res.status(401).json({ error: 'Incorrect email or password' });

        // decrypt the password
        const auth = await bcrypt.compare(password, user.password);
            
        // Check if provided password matches the one in the database
        if (!auth) return res.status(401).json({ error: 'Incorrect email or password' });

        // Generate JWT token and send it to the client
        const accessToken = generateAccessToken(user);

        const refreshToken = jwt.sign(user, process.env.JWT_SECRET_REFRESH_TOKEN, { expiresIn: '30s' });
        
        await Token.create({ token: refreshToken });

        res.status(200).header('Authorization', accessToken).json({ accessToken: accessToken, refreshToken: refreshToken });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// Handle user logout request
async function logout(req, res) {
    try {
        const token = req.body.token
        if (!token) return res.status(401).send({ error: 'token is required' });

        // remove token to Token to prevent future use
        const deletedToken = await Token.findOneAndDelete({ token });

        if (deletedToken) return res.status(200).json({ tokendeleted : deletedToken, message: 'User logged out successfully' });

        // Extract JWT token from Authorization header
        req.header('Authorization').replace('Bearer ', '');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Middleware to authenticate requests
function authenticateToken(req, res, next) {
    // Extract the Authorization header and the token from it
    const authHeader = req.headers('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    // If no token is present, return an error response
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    // Verify the token using the secret key
    jwt.verify(token, process.env.JWT_SECRET_ACCESS_TOKEN, (err, user) => {
        // If the token is invalid, return a forbidden error response
        if (err) return res.status(403).json({ message: 'Forbidden' });

        // Store the user object in the request object and move to the next middleware
        req.user = user;
        next();
    });
}

fix all the error