const request = require('supertest');

const app = require('../../app');
const User = require('../../model/user.mongo');
const TokenWhitelist = require('../../model/tokenwhitelist.mongo');
const { mongooseConnect, mongooseDisconnect } = require('../../utils/mongo');

describe('User Routes Endpoints', () => {
  let tokenwhitelisted;

  beforeAll(async () => await mongooseConnect());

  afterAll(async () => {
    await User.deleteMany({});
    await TokenWhitelist.deleteMany({});

    await mongooseDisconnect()
  });

  describe('POST /users', () => {
    test('should register a new user', async () => {
      const newUser = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password',
        gender: 'Male',
      };

      const response = await request(app)
        .post('/api/users/signup')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(typeof response.body).toBe('object');
    });
  });
  
  describe('GET /api/users', () => {

    it('should require authentication', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should return an array of users when authenticated', async () => {
      const login = await request(app)
        .post('/api/login')
        .send({ email: 'testuser@example.com', password: 'password' });
      
      tokenwhitelisted = login.body.accessToken
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `${tokenwhitelisted}`)
      expect(response.status).toBe(200);
      expect(typeof response.body).toBe('object');
    });
  });

  describe('GET /users/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/users/1');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should return a user by ID when authenticated', async () => {
      const { _id } = await User.find({ email: 'testuser@example.com' });
      
      const login = await request(app)
        .post('/api/login')
        .send({ email: 'testuser@example.com', password: 'password' });
      
      tokenwhitelisted = login.body.accessToken
      const response = await request(app)
        .get(`/api/users/${_id}`)
        .set('Authorization', `${tokenwhitelisted}`)
      expect(typeof response.body).toBe('object');
    });
  });

  describe('GET /users/male', () => {
    it('should return an array of male users when authenticated', async () => {
      await User.create({
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password',
        gender: 'Female',
      });

      const login = await request(app)
        .post('/api/login')
        .send({ email: 'testuser@example.com', password: 'password' });
      
      tokenwhitelisted = login.body.accessToken
      // Send a GET request to /users/male with the auth token
      const response = await request(app)
        .get('/api/users/male')
        .set('Authorization', `${tokenwhitelisted}`);

      // Expect the response body to contain an array with only male users
      expect(response.status).toBe(200);
      response.body.forEach(user => expect(user.gender).toBe('Male'));
    });

    it('should return a 401 Unauthorized error when not authenticated', async () => {
      const response = await request(app).get('/api/users/male');
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Unauthorized' });
    });
  });

  describe('PATCH /users/:id', () => {
    test('should update a user', async () => {
      const user = await User.findOne({ email: 'jane@example.com' });
      const updatedUser = {
        name: 'Jane Doe',
        email: 'female@gmail.com',
      };
      
      const login = await request(app)
        .post('/api/login')
        .send({ email: 'jane@example.com', password: 'password' });
      
      tokenwhitelisted = login.body.accessToken

      const response = await request(app)
        .patch(`/api/users/${user._id}`)
        .set('Authorization', `${tokenwhitelisted}`)
        .send(updatedUser);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updatedUser.name);
      expect(response.body.email).toBe(updatedUser.email);
    });
  });

  describe('DELETE /users/:id', () => {
    test('should delete a user', async () => {
      const user = await User.findOne({ email: 'female@gmail.com' });

      const login = await request(app)
        .post('/api/login')
        .send({ email: 'testuser@example.com', password: 'password' });
      
      tokenwhitelisted = login.body.accessToken

      const response = await request(app)
        .delete(`/api/users/${user._id}`)
        .set('Authorization', `${tokenwhitelisted}`)

      // Check if the user is deleted
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User has been deleted');
    });
  });
  
});
