const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config()

const Token = require('../../model/token.mongo');
const User = require('../../model/user.mongo');

function generateAccessToken(user) {
    return jwt.sign(user, process.env.JWT_SECRET_ACCESS_TOKEN, { expiresIn: '1h' });
}

// Handle refresh token
async function getRefreshToken(req, res) {
    const refreshToken = req.body.token
    if (!refreshToken) return res.status(404).send({ error: 'refresh token is required' });

    try {
        const token = await Token.findOne({ token: refreshToken });
        if (!token) return res.status(403).send({ error: 'token not found' });

        jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH_TOKEN, (err, user) => {
            if (err) return res.status(403).json({ error: err.message });
        
            const accessToken = generateAccessToken({ _id: user._id })

            res.status(200).header('Authorization', accessToken)
                .json({ accessToken: accessToken })
        });
    } catch (error) {
        res.status(500).send(error);
    }
}

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
        const accessToken = generateAccessToken({ _id: user._id });

        const refreshToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_REFRESH_TOKEN, { expiresIn: '1h' });

        await Token.create({ token: refreshToken });

        res.status(200)
            .header('Authorization', accessToken)
            .json({ accessToken: accessToken, refreshToken: refreshToken });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
}

// Handle user logout request
async function logout(req, res) {
    try {
        const token = req.body.token;
        if (!token) return res.status(401).send({ error: 'Token is required' });

        // remove token from Token collection to prevent future use
        const deletedToken = await Token.findOneAndDelete({ token });

        if (!deletedToken) return res.status(401)
            .json({ message: 'Unable to logout' });

        res.status(200)
            .json({ message: 'Logged out successfully' });

    } catch (err) {
        console.error('Error logging out user', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Middleware to authenticate requests
function authenticateToken(req, res, next) {
    // Extract the Authorization header and the token from it
    const authHeader = req.header('Authorization');

    // If no authHeader is present, return an error response
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

    // Verify the authHeader using the secret key
    jwt.verify(authHeader, process.env.JWT_SECRET_ACCESS_TOKEN, (err, user) => {
        // If the authHeader is invalid, return a forbidden error response
        if (err) return res.status(401).json({ message: 'Unauthorized' });

        // Store the user object in the request object and move to the next middleware
        req.user = user;
        next();
    });
}

module.exports = {
    generateAccessToken,
    getRefreshToken,
    login,
    logout,
    authenticateToken,
}