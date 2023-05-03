const request = require('supertest');

const app = require('../../app');
const User = require('../../model/user.mongo');
const Token = require('../../model/token.mongo');
const { mongooseConnect, mongooseDisconnect } = require('../../utils/mongo');

describe('Authentication Endpoints', () => {
    let testUser;
    let authToken;

    beforeAll(async () => {
        await mongooseConnect();

        testUser = new User({
            name: 'Test User',
            email: 'testuser@example.com',
            password: 'password',
        });
        await testUser.save();

        const res = await request(app)
            .post('/api/login')
            .send({ email: 'testuser@example.com', password: 'password' });
        authToken = res.body.accessToken;
    });

    afterAll(async () => {
        await User.deleteMany({
            email: { $in: ['testuser@example.com', 'user@example.com', 'test@example.com'] }
        });
        await Token.deleteMany({});

        await mongooseDisconnect();
    });

    describe('User model', () => {
        it('should hash password before saving', async () => {
            const user = new User({
                name: 'Test User',
                email: 'user@example.com',
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
                email: 'test@example.com',
                password: 'password123',
            });

            const user2 = new User({
                name: 'Test User 2',
                email: 'test@example.com',
                password: 'password456',
            });

            await user1.save();

            let err;
            try {
                await user2.save();
            } catch (error) {
                err = error;
            }

            expect(err.errors && err.errors.email).toBeDefined();
        });

        it('should create user with default gender if not provided', async () => {
            const user = new User({
                name: 'Test User',
                email: 'god@example.com',
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
                .send({ email: 'testuser@example.com', password: 'password' });
            expect(res.statusCode).toEqual(200);
            expect(res.body.accessToken).toBeDefined();
        });

        test('should return an error for an invalid login', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({ email: 'testuser@example.com', password: 'wrongpassword' });
            expect(res.statusCode).toEqual(401);
            expect(res.body.error).toEqual('Unauthorized');
        });
    });
    
    describe('POST /api/logout', () => {
        test('should delete the auth token for the current user', async () => {
            const res = await request(app)
                .post('/api/logout')
                .set('Authorization', `${authToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual('Logged out successfully');
            const token = await Token.findOne({ token: authToken });
            expect(token).toBeNull();
        });

        test('should return an error if no auth token is provided', async () => {
            const res = await request(app).post('/api/logout');
            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GET /api/token', () => {
        test('should return the auth token for the current user', async () => {
            const res = await request(app)
                .get('/api/token')
                .set('Authorization', `${authToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.accessToken).toBeDefined();
        });

        test('should return an error if no auth token is provided', async () => {
            const res = await request(app).get('/api/token');
            expect(res.statusCode).toEqual(401);
            expect(res.body.error).toEqual('Unauthorized');
        });
    });
});