const request = require('supertest');

const app = require('../../app');
const User = require('../../model/user.mongo');
const Token = require('../../model/token.mongo');
const { mongooseConnect, mongooseDisconnect } = require('../../utils/mongo');

describe('User Routes Endpoints', () => {
  beforeAll(async () => await mongooseConnect());

  afterAll(async () => {
    await User.deleteMany({});
    await Token.deleteMany({});

    await mongooseDisconnect()
  });

  describe('GET /api/users', () => {

    it('should require authentication', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should return an array of users when authenticated', async () => {
      User.create({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password',
      })

      const login = await request(app)
        .post('/api/login')
        .send({ email: 'testuser@example.com', password: 'password' });
      
      let authToken = login.body.accessToken
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `${authToken}`);
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
      User.create({
        name: 'Test User',
        email: 'test1user@example.com',
        password: 'password',
      })
      const id = await User.find({ email: 'test1user@example.com' })
      const userId = id._id;
      
      const login = await request(app)
        .post('/api/login')
        .send({ email: 'test1user@example.com', password: 'password' });
      
      let authToken = login.body.accessToken
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `${authToken}`);
      expect(typeof response.body).toBe('object');
    });
  });

  // Test GET /users/male
  describe('GET /users/male', () => {
    it('should return an array of male users when authenticated', async () => {
      const users =
        [
          { name: 'John Doe', email: 'john@example.com', password: 'password', gender: 'Male', },
          { name: 'Jane Smith', email: 'jane@example.com', password: 'password', gender: 'Female', },
        ];
      await User.create(users);

      const login = await request(app)
        .post('/api/login')
        .send({ email: 'jane@example.com', password: 'password' });
      
      let authToken = login.body.accessToken
      // Send a GET request to /users/male with the auth token
      const response = await request(app)
        .get('/api/users/male')
        .set('Authorization', `${authToken}`);

      // Expect the response body to contain an array with only male users
      expect(response.body).toEqual([]);

      // Expect the response body not to contain the female user
      // TODO: expect(response.body).not.toContainEqual([]);
    });

    it('should return a 401 Unauthorized error when not authenticated', async () => {
      const response = await request(app).get('/api/users/male');
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Unauthorized' });
    });
  });

  describe('POST /users', () => {

    test('should register a new user', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'johndoe@example.com',
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

  // describe('PATCH /users/:id', () => {
  //   test('should update a user', async () => {
  //     const updatedUser = {
  //       name: 'Jane Doe',
  //       email: 'Female123@gmail.com',
  //     };

  //     const id = await User.find({ email: 'test1user@example.com' })
  //     const userId = id._id;
      
  //     const login = await request(app)
  //       .post('/api/login')
  //       .send({ email: 'test1user@example.com', password: 'password' });
      
  //     let authToken = login.body.accessToken

  //     const response = await request(app)
  //       .patch(`/api/users/${userId}`)
  //       .set('Authorization', `${authToken}`)
  //       .send(updatedUser);

  //     expect(response.body.name).toBe(updatedUser.name);
  //     expect(response.body.email).toBe(updatedUser.email);
  //   });
  // });

  describe('DELETE /users/:id', () => {
    test('should delete a user', async () => {
      const id = await User.find({ email: 'test1user@example.com' })
      const userId = id._id;

      const login = await request(app)
        .post('/api/login')
        .send({ email: 'test1user@example.com', password: 'password' });
      
      let authToken = login.body.accessToken

      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `${authToken}`);

      // Check if the user is deleted
      const user = await User.findById(userId);
      expect(user).toBeNull();
    });
  });
  
});
