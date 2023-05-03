const request = require('supertest');

const app = require('../../server');
const User = require('../../model/user.mongo');
const { mongooseConnect, mongooseDisconnect } = require('../../utils/mongo');

describe('User Routes Endpoints', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    await mongooseConnect();
    let testUser = {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password',
    }

    const createUserResponse = await request(app)
      .post('/users/signup')
      .send(testUser);

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'testuser@example.com', password: 'password' });
    
    authToken = response.body.accessToken;
    userId = createUserResponse.body._id;
  });

  afterAll(async () => {
    await mongooseDisconnect()

    await User.deleteMany({
      email: { $in: ['testuser@example.com', 'john@example.com', 'jane@example.com'] }
    });
    await Token.deleteOne({ token: authToken });
  });

  describe('GET /users', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should return an array of users when authenticated', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body._id).toEqual(userId);
    });
  });

  describe('GET /users/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/users/1');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should return a user by ID when authenticated', async () => {
      const response = await request(app)
        .get(`/users/${userId}`)
        .set('authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body._id).toEqual(userId);
    });
  });

  // Test GET /users/male
  describe('GET /users/male', () => {
    it('should return an array of male users when authenticated', async () => {
      // Create two male users and one female user
      const users =
        [
          { name: 'John Doe', email: 'john@example.com', password: 'password', gender: 'Male', },
          { name: 'Jane Smith', email: 'jane@example.com', password: 'password', gender: 'Female', },
        ];
      await User.create(users);

      // Authenticate the first male user
      const authToken = generateAuthToken({ id: users[0]._id });

      // Send a GET request to /users/male with the auth token
      const response = await request(app)
        .get('/api/users/male')
        .set('authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(200);

      // Expect the response body to contain an array with only male users
      expect(response.body).toEqual(
        expect.objectContaining(
          {
            name: users[0].name,
            email: users[0].email,
            gender: 'Male',
          }
        ),
        expect.objectContaining(
          {
            name: users[1].name,
            email: users[1].email,
            gender: 'Male',
          }
        ),
      );

      // Expect the response body not to contain the female user
      expect(response.body).not.toContainEqual(expect.objectContaining(
        {
          name: users[2].name,
          email: users[2].email,
          gender: 'Female',
        }
      ));

      it('should return a 401 Unauthorized error when not authenticated', async () => {
        const response = await request(app).get('/api/users/male');
        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Unauthorized' });
      });
    });
  });

  describe('POST /users', () => {

    test('should create a new user', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: 'password',
        gender: 'Male',
      };

      const response = await request(app)
        .post('/api/users')
        .set('authorization', `Bearer ${authToken}`)
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(newUser.name);
      expect(response.body.email).toBe(newUser.email);
      expect(response.body.gender).toBe(newUser.gender);
    });
  });

  describe('PATCH /users/:id', () => {
    test('should update a user', async () => {
      const updatedUser = {
        name: 'Jane Doe',
        gender: 'Female',
      };

      const response = await request(app)
        .patch(`/api/users/${userId}`)
        .set('authorization', `Bearer ${authToken}`)
        .send(updatedUser);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updatedUser.name);
      expect(response.body.gender).toBe(updatedUser.gender);
    });
  });

  describe('DELETE /users/:id', () => {
    test('should delete a user', async () => {
      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .set('authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Check if the user is deleted
      const user = await User.findById(userId);
      expect(user).toBeNull();
    });
  });
  
});
