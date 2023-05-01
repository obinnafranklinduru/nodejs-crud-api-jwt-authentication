const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../model/user.mongo');

// Handle user login request
async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Check if user with given email exists in database
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if provided password matches the one in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token and send it to the client
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Handle user logout request
async function logout(req, res) {
    try {
        // Get the token from the request header and add it to the blacklist
        const token = req.header('Authorization').replace('Bearer ', '');
        const blacklist = await Blacklist.create({ token });

        res.json({ message: 'User logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Middleware to authenticate requests
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        req.user = user;
        next();
    });
}

module.exports = {
    login,
    logout,
    authenticateToken
}