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
    if (!refreshToken) return res.status(401).send({ error: 'refresh token is required' });

    const token = Token.findOne({ token: refreshToken });
    if (!token) return res.status(403).send({ error: 'token not found' });

    jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH_TOKEN, (err, user) => {
        if (err) return res.status(403).json({ error: err.message });
        
        const accessToken = generateAccessToken({ _id: user._id })

        res.header("authorization", accessToken)
            .json({ accessToken: accessToken })
    })
}

// Handle user login request
async function login(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        // Check if user with given email exists in database
        if (!user) return res.status(400).json({ error: 'Incorrect email or password' });

        // decrypt the password
        const auth = await bcrypt.compare(password, user.password);
            
        // Check if provided password matches the one in the database
        if (!auth) return res.status(400).json({ error: 'Incorrect email or password' });

        // Generate JWT token and send it to the client
        const accessToken = generateAccessToken(user);

        const refreshToken = jwt.sign(user, process.env.JWT_SECRET_REFRESH_TOKEN, { expiresIn: '30s' });
        
        await Token.create({ token: refreshToken });

        res.header("authorization", accessToken).json({ accessToken: accessToken, refreshToken: refreshToken });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// Handle user logout request
async function logout(req, res) {
    try {
        const token = req.body.token
        if (!token) return res.status(403).send({ error: 'token is required' });

        // remove token to Token to prevent future use
        const deletedToken = await Token.findOneAndDelete({ token });

        if (deletedToken) return res.json({ tokendeleted : deletedToken, message: 'User logged out successfully' });

        // Extract JWT token from authorization header
        req.header("authorization").replace('Bearer ', '');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Middleware to authenticate requests
function authenticateToken(req, res, next) {
    // Extract the authorization header and the token from it
    const authHeader = req.headers("authorization");
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

module.exports = {
    generateAccessToken,
    getRefreshToken,
    login,
    logout,
    authenticateToken,
}