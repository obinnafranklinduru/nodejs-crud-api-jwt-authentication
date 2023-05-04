# Node.js CRUD API with JWT Authentication

This is a Node.js API project that demonstrates how to perform CRUD (Create, Read, Update, Delete) operations on a database and utilize JSON Web Tokens (JWT) for user authentication. It includes endpoints for creating, reading, updating, and deleting users, as well as for retrieving all users and filtering by gender. The project uses the popular Express.js framework and MongoDB for the database.

## Prerequisites

To run this project, you will need to have the following installed on your system:

- [Node.js](https://nodejs.org/en/)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/)

## Installation

1. Clone this repository to your local machine.
2. Install the required packages by running `npm install` in the root directory of the project.
3. Start the API server by running `npm start`.
4. Test the API by running `npm test`.

## Usage

Once the API server is running, you can use [Postman](https://www.postman.com/) or any other HTTP client to test the endpoints.

### Endpoints

| Method | Endpoint    | Description                                           |
| ------ | ----------- | ----------------------------------------------------- |
| POST   | /api/users      | Create a new user                                     |
| GET    | /api/users/:id  | Retrieve a user by ID (requires JWT authentication)   |
| PUT    | /api/users/:id  | Update a user by ID (requires JWT authentication)     |
| DELETE | /api/users/:id  | Delete a user by ID (requires JWT authentication)     |
| GET    | /api/users      | Retrieve all users                                    |
| GET    | /api/users/male | Retrieve all male users (requires JWT authentication) |
| POST   | /api/login      | Authenticate user and generate JWT token              |

### Authentication

Some of the endpoints require JWT authentication. To authenticate a user and generate a token, send a POST request to the `/login` endpoint with the user's email and password in the request body. The endpoint will return a JWT token that can be used to access the protected endpoints.

To use the token, include it in the `Authorization` header of the request.

### Environment Variables

The project uses environment variables to store sensitive information, such as the MongoDB connection string and JWT secret key. These variables are defined in a `.env` file in the root directory of the project. A `.env.example` file is included as a template.

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](https://opensource.org/license/mit/) file for details.