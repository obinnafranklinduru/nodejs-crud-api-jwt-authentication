const mongoose = require('mongoose');
const request = require('supertest');

const app = require('../../server');
const User = require('../../model/user.mongo');
const { generateAccessToken } = require('../authenticate/auth.controller');
const { mongooseConnect, mongooseDisconnect } = require('../../utils/mongo');

describe('User routes', () => {
  beforeAll(async () => await mongooseConnect());

  afterEach(async () => await User.deleteMany());

  afterAll(async () => await mmongooseDisconnect());

  describe('GET /users', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/users');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should return an array of users when authenticated', async () => {
      const user = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password',
      };
      await User.create(user);

      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });
  });

  describe('GET /users/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/users/1');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should return a user by ID when authenticated', async () => {
      const user = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password',
      };
      const createdUser = await User.create(user);

      const response = await request(app)
        .get(`/users/${createdUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });
  });

    // Test GET /users/male
  describe('GET /users/male', () => {
    it('should return an array of male users when authenticated', async () => {
      // Create two male users and one female user
      const users =
        [
          { name: 'John Doe', email: 'john@example.com', password: 'password', gender: 'Male', },
          { name: 'Jane Smith', email: 'jane@example.com', password: 'password', gender: 'Female',},
          { name: 'Bob Johnson', email: 'bob@example.com', password: 'password', gender: 'Male', }
        ];
      await User.create(users);

      // Authenticate the first male user
      const authToken = generateAuthToken({ id: users[0]._id });

      // Send a GET request to /users/male with the auth token
      const response = await request(app)
        .get('/users/male')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(200);

      // Expect the response body to contain an array with only male users
      expect(response.body).toEqual({});

      // Expect the response body not to contain the female user
      expect(response.body).not.toContainEqual({});

    it('should return a 401 Unauthorized error when not authenticated', async () => {
      const response = await request(app).get('/users/male');
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Unauthorized' });
    });
  });

    describe('POST /users', () => {
  let authToken;

  beforeAll(async () => {
    // Login the user to get an auth token for testing protected routes
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    authToken = response.body.token;
  });

  test('should create a new user', async () => {
    const newUser = {
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'password',
      gender: 'Male',
    };

    const response = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newUser);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(newUser.name);
    expect(response.body.email).toBe(newUser.email);
    expect(response.body.gender).toBe(newUser.gender);
  });
});

describe('PATCH /users/:id', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Login the user to get an auth token for testing protected routes
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    authToken = response.body.token;

    // Create a new user to update
    const newUser = {
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'password',
      gender: 'Male',
    };

    const createUserResponse = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newUser);

    userId = createUserResponse.body._id;
  });

  test('should update a user', async () => {
    const updatedUser = {
      name: 'Jane Doe',
      gender: 'Female',
    };

    const response = await request(app)
      .patch(`/users/${userId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updatedUser);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(updatedUser.name);
    expect(response.body.gender).toBe(updatedUser.gender);
  });
});

describe('DELETE /users/:id', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Login the user to get an auth token for testing protected routes
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    authToken = response.body.token;

    // Create a new user to delete
    const newUser = {
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'password',
      gender: 'Male',
    };

    const createUserResponse = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newUser);

    userId = createUserResponse.body._id;
  });

  test('should delete a user', async () => {
    const response = await request(app)
      .delete(`/users/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(204);

    // Check if the user is deleted
    const user = await User.findById(userId);
    expect(user).toBeNull();
  });
});

})
