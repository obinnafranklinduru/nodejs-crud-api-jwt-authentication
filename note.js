const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/user');

describe('User routes', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany();
  });

  describe('POST /register', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password',
        })
        .expect(201);

      // Ensure the response includes the newly created user's ID
      expect(res.body).toHaveProperty('_id');
    });

    it('should return a 400 error if missing required fields', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          name: 'Test User',
        })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('should return a 409 error if email address already exists', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
      });

      await user.save();

      const res = await request(app)
        .post('/register')
        .send({
          name: 'Another User',
          email: 'test@example.com',
          password: 'password',
        })
        .expect(409);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /login', () => {
    it('should login a user with valid credentials', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
      });

      await user.save();

      const res = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'password',
        })
        .expect(200);

      expect(res.body).toHaveProperty('token');
    });

    it('should return a 401 error with invalid credentials', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
      });

      await user.save();

      const res = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });
  });
});
