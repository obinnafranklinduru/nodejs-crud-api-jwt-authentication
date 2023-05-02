const jwt = require('jsonwebtoken');
const Blacklist = require('../../model/token.mongo');
const User = require('../../model/user.mongo');
require('dotenv').config()

// Handle creation of JWT
function createToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET_ACCESS_TOKEN)
}

// Handle user login request
async function login(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.login(email, password);

        // Generate JWT token and send it to the client
        const accessToken = createToken(user._id)

        res.status(200).json({ user: user._id, token: accessToken });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// Handle user logout request
async function logout(req, res) {
    try {
        // Extract JWT token from authorization header
        const token = req.header('Authorization').replace('Bearer ', '');

        // Add token to blacklist to prevent future use
        await Blacklist.create({ token });

        // Respond with success message
        res.json({ message: 'User logged out successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Middleware to authenticate requests
function authenticateToken(req, res, next) {
    // Extract the authorization header and the token from it
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    // If no token is present, return an error response
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify the token using the secret key
    jwt.verify(token, process.env.JWT_SECRET_ACCESS_TOKEN, (err, user) => {
        // If the token is invalid, return a forbidden error response
        if (err) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // Store the user object in the request object and move to the next middleware
        req.user = user;
        next();
    });
}

module.exports = {
    createToken,
    login,
    logout,
    authenticateToken
}