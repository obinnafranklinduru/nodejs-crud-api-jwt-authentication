const http = require('http');
const app = require('./app');
const { mongooseConnect } = require('./utils/mongo');
const PORT = process.env.PORT || 3000;

// Create a new HTTP server using the app as its request listener.
const server = http.createServer(app)

const startServer = async () => {
    try {
        // Connect to the MongoDB database using the mongooseConnect function.
        await mongooseConnect();

        // Start the server, listening on the specified port.
        server.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
    } catch (e) {
        console.error(e.message);
    }
}

startServer();