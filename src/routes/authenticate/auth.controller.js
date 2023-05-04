const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config()

const User = require('../../model/user.mongo');
const TokenBlacklist = require('../../model/tokenblacklist.mongo');
const TokenWhitelist = require('../../model/tokenwhitelist.mongo');

// Handle user login request
async function login(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        // Check if user with given email exists in database
        if (!user) throw new Error('Incorrect email or password');

        // decrypt the password
        const auth = await bcrypt.compare(password, user.password);
            
        // Check if provided password matches the one in the database
        if (!auth) throw new Error('Incorrect email or password');

        // Generate JWT token and send it to the client
        const accessToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_ACCESS_TOKEN, { expiresIn: '1h' });
        
        // Add the token to the whitelist
        const whitelistedToken = new TokenWhitelist({ token: accessToken });
        await whitelistedToken.save();

        res.status(200)
            .header('Authorization', accessToken)
            .json({ accessToken: accessToken });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
}

// Handle user logout request
async function logout(req, res) {
    try {
        // Extract the Authorization header and the token from it
        const token = req.body.token;

        if (!token) throw new Error('Token is required');

        // Check if token is in the whitelist
        const whitelistedToken = await TokenWhitelist.findOne({ token });
        if (!whitelistedToken) return res.status(401).json({ message: 'Token Invaild' });

        // Add the token to the blacklist
        const blacklistedToken = new TokenBlacklist({ token });
        await blacklistedToken.save();

        await TokenWhitelist.findOneAndDelete({ token });

        res.status(200).json({ message: 'Logout successful' });
    } catch (err) {
        console.error('Error logging out user', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Middleware to authenticate requests
async function authenticateToken(req, res, next) {
    try {
        // Extract the Authorization header and the token from it
        const authHeader = req.header('Authorization');

        // If no authHeader is present, return an error response
        if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

        // Check if token is in the blacklist
        const blacklistedToken = await TokenBlacklist.findOne({ token: authHeader });
        if (blacklistedToken) return res.status(401).json({ message: 'Unauthorized' });

        // Verify the authHeader using the secret key
        jwt.verify(authHeader, process.env.JWT_SECRET_ACCESS_TOKEN, (err, user) => {
            // If the authHeader is invalid, return a forbidden error response
            if (err) return res.status(401).json({ message: 'Unauthorized' });

            // Store the user object in the request object and move to the next middleware
            req.user = user;
            next();
        });
    } catch (error) {
        console.error('Error verifying token', error);
    }
}

module.exports = {
    login,
    logout,
    authenticateToken,
}