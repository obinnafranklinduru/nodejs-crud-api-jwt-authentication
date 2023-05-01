const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const User = require('../models/userModel');

describe('User Controller', () => {
    beforeAll(async () => {
        await mongoose.connect(global.__MONGO_URI__, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('GET /users', () => {
        it('should return an empty array of users', async () => {
            const response = await request(app).get('/users');
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(0);
        });

        it('should return an array of all users', async () => {
            const user1 = { name: 'John', gender: 'male' };
            const user2 = { name: 'Jane', gender: 'female' };
            await User.create(user1, user2);

            const response = await request(app).get('/users');
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);
            expect(response.body[0].name).toBe(user1.name);
            expect(response.body[0].gender).toBe(user1.gender);
            expect(response.body[1].name).toBe(user2.name);
            expect(response.body[1].gender).toBe(user2.gender);
        });
    });

    describe('GET /users/male', () => {
        it('should return an empty array of male users', async () => {
            const response = await request(app).get('/users/male');
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(0);
        });

        it('should return an array of male users', async () => {
            const maleUser1 = { name: 'John', gender: 'male' };
            const femaleUser1 = { name: 'Jane', gender: 'female' };
            const maleUser2 = { name: 'Bob', gender: 'male' };
            await User.create(maleUser1, femaleUser1, maleUser2);

            const response = await request(app).get('/users/male');
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);
            expect(response.body[0].name).toBe(maleUser1.name);
            expect(response.body[0].gender).toBe(maleUser1.gender);
            expect(response.body[1].name).toBe(maleUser2.name);
            expect(response.body[1].gender).toBe(maleUser2.gender);
        });
    });
});