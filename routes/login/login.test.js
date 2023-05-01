const { mockRequest, mockResponse } = require('jest-mock-req-res');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../models/userModel');
const Token = require('../../models/tokenModel');
const authController = require('../../controllers/authController');

jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../../models/userModel');
jest.mock('../../models/tokenModel');

describe('authController', () => {
    describe('register', () => {
        let req;
        let res;

        beforeEach(() => {
            req = mockRequest();
            res = mockResponse();
        });

        it('should create a new user with hashed password', async () => {
            const password = 'password';
            const hashedPassword = 'hashedPassword';
            const user = {
                _id: '1234',
                name: 'John Doe',
                email: 'john@example.com',
                password: hashedPassword,
            };

            req.body = {
                name: 'John Doe',
                email: 'john@example.com',
                password,
            };

            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue(hashedPassword);
            User.create.mockResolvedValue(user);

            await authController.register(req, res);

            expect(bcrypt.genSalt).toBeCalledWith(10);
            expect(bcrypt.hash).toBeCalledWith(password, 'salt');
            expect(User.create).toBeCalledWith({
                name: 'John Doe',
                email: 'john@example.com',
                password: hashedPassword,
            });
            expect(res.status).toBeCalledWith(201);
            expect(res.json).toBeCalledWith({
                message: 'User created successfully',
                user: {
                    _id: '1234',
                    name: 'John Doe',
                    email: 'john@example.com',
                },
            });
        });

        it('should return a 400 error if email is not provided', async () => {
            req.body = {
                name: 'John Doe',
                password: 'password',
            };

            await authController.register(req, res);

            expect(res.status).toBeCalledWith(400);
            expect(res.json).toBeCalledWith({
                error: 'Please provide a name, email and password',
            });
        });

        it('should return a 400 error if password is not provided', async () => {
            req.body = {
                name: 'John Doe',
                email: 'john@example.com',
            };

            await authController.register(req, res);

            expect(res.status).toBeCalledWith(400);
            expect(res.json).toBeCalledWith({
                error: 'Please provide a name, email and password',
            });
        });

        it('should return a 409 error if email is already taken', async () => {
            req.body = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password',
            };

            User.findOne.mockResolvedValue({
                _id: '1234',
                name: 'John Doe',
                email: 'john@example.com',
            });

            await authController.register(req, res);

            expect(User.findOne).toBeCalledWith({ email: 'john@example.com' });
            expect(res.status).toBeCalledWith(409);
            expect(res.json).toBeCalledWith({
                error: 'Email address already in use',
            });
        });

        it('should handle errors thrown by User.create', async () => {
            req.body = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password',
            };

            const error = new Error('Failed to create user');
            jest.spyOn(User, 'create').mockRejectedValue(error);

            await userController.createUser(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({ error: error.message });
        })
        it('should return 401 Unauthorized error when given invalid token', async () => {
            const response = await request(app)
                .post('/auth/logout')
                .set('Authorization', `Bearer invalid_token`);
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Unauthorized');
        });

        it('should return 401 Unauthorized error when given expired token', async () => {
            // generate an expired token
            const expiredToken = jwt.sign({ userId: createdUser._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '-1s' });

            const response = await request(app)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${expiredToken}`);
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Unauthorized');
        });

        it('should logout the user successfully when given a valid access token', async () => {
            const response = await request(app)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`);
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Successfully logged out');
        });

        it('should revoke all tokens when user password is changed', async () => {
            // generate another access token before changing password
            const anotherAccessToken = jwt.sign({ userId: createdUser._id }, process.env.ACCESS_TOKEN_SECRET);

            const response = await request(app)
                .put(`/users/${createdUser._id}/password`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ newPassword: 'newpassword' });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Password updated successfully');

            // attempt to use revoked access token
            const accessResponse = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${accessToken}`);
            expect(accessResponse.status).toBe(401);
            expect(accessResponse.body.message).toBe('Unauthorized');

            // attempt to use another access token
            const anotherAccessResponse = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${anotherAccessToken}`);
            expect(anotherAccessResponse.status).toBe(401);
            expect(anotherAccessResponse.body.message).toBe('Unauthorized');

            // generate new access token after password change
            const newAccessToken = jwt.sign({ userId: createdUser._id }, process.env.ACCESS_TOKEN_SECRET);
            const newAccessResponse = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${newAccessToken}`);
            expect(newAccessResponse.status).toBe(200);
            expect(newAccessResponse.body).toHaveProperty('users');
            expect(newAccessResponse.body.users).toHaveLength(1);
        });
    });
});
