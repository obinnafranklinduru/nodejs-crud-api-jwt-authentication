const request = require('supertest');

const app = require('../../app');
const User = require('../../model/user.mongo');
const TokenWhitelist = require('../../model/tokenwhitelist.mongo');
const TokenBlacklist = require('../../model/tokenblacklist.mongo');
const { mongooseConnect, mongooseDisconnect } = require('../../utils/mongo');

describe('Authentication Endpoints', () => {
    let tokenwhitelisted;
    let tokenblacklisted;

    beforeAll(async () => await mongooseConnect());

    afterAll(async () => {
        await User.deleteMany({
            email: {
                $in: ['testuser@example.com', 'test1@example.com', 'good@example.com']
            }
        });
        await TokenWhitelist.deleteOne({ token: tokenwhitelisted });
        await TokenBlacklist.deleteOne({ token: tokenblacklisted.token });

        await mongooseDisconnect();
        
    });

    describe('User model', () => {
        it('should hash password before saving', async () => {
            const user = new User({
                name: 'Test User',
                email: 'testuser@example.com',
                password: 'password123',
            });
      
            await user.save();
      
            expect(user.password).not.toBe('password123');
        });

        it('should throw validation errors if required fields are missing', async () => {
            const user = new User({});
            let err;
            try {
                await user.save();
            } catch (error) {
                err = error;
            }
            expect(err.errors && err.errors.name).toBeDefined();
            expect(err.errors && err.errors.email).toBeDefined();
            expect(err.errors && err.errors.password).toBeDefined();
        });

        it('should throw validation errors if email is invalid', async () => {
            const user = new User({
                name: 'Test User',
                email: 'invalid-email',
                password: 'password123',
            });
            let err;
            try {
                await user.save();
            } catch (error) {
                err = error;
            }

            expect(err.errors && err.errors.email).toBeDefined();
        });

        it('should throw validation errors if password is too short', async () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'short',
            });
            let err;
            try {
                await user.save();
            } catch (error) {
                err = error;
            }

            expect(err.errors && err.errors.password).toBeDefined();
        });

        it('should throw validation errors if email already exists', async () => {
            const user1 = new User({
                name: 'Test User 1',
                email: 'test1@example.com',
                password: 'password123',
            });

            const user2 = new User({
                name: 'Test User 2',
                email: 'test1@example.com',
                password: 'password456',
            });

            await user1.save();

            let err;
            try {
                await user2.save();
            } catch (error) {
                err = error;
            }

            expect(err.message).toContain('E11000 duplicate key error collection: crudApi.users index: email_1 dup key');

        });

        it('should create user with default gender if not provided', async () => {
            const user = new User({
                name: 'Test User',
                email: 'good@example.com',
                password: 'password123',
            });
            await user.save();
            expect(user.gender).toBe('Male');
        });
    });

    describe('POST /api/login', () => {
        test('should return an auth token for a valid login', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({ email: 'testuser@example.com', password: 'password123' });
            expect(res.statusCode).toEqual(200);
            tokenwhitelisted = res.body.accessToken
            expect(tokenwhitelisted).toBeDefined();
        });

        test('should return an error for an invalid login', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({ email: 'testuser@example.com', password: 'wrongpassword' });
            expect(res.statusCode).toEqual(401);
            expect(res.body.error).toEqual('Incorrect email or password');
        });

        test('should return an error for an invalid login', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({ email: 'wrongemail@example.com', password: 'password123' });
            expect(res.statusCode).toEqual(401);
            expect(res.body.error).toEqual('Incorrect email or password');
        });
    });
    
    describe('POST /api/logout', () => {
        test('should blacklist the auth token for the current user', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({ email: 'testuser@example.com', password: 'password123' });
            
            const authToken = response.body.accessToken
            const res = await request(app)
                .post('/api/logout')
                .set('Authorization', authToken)
                .send({ token: authToken});
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual('Logout successful');
            tokenblacklisted = await TokenBlacklist.findOne({ token: authToken });
            expect(tokenblacklisted.token).toBe(authToken);
        });

        test('should return an error if no auth token is provided', async () => {
            const res = await request(app).post('/api/logout');
            expect(res.statusCode).toEqual(401);
        });
    });
});