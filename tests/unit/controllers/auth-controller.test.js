const jwt = require('jsonwebtoken');
const { register, login } = require('../../../controllers/auth-controller');
const { pool } = require('../../../config/database');

// Mock
jest.mock('../../../config/database', () => ({
  pool: { execute: jest.fn() }
}));

jest.mock('../../../models/user-model', () => jest.fn(u => u));
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn(() => res), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('should reject missing fields', async () => {
      req.body = { username: 'test' };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should register successfully', async () => {
      req.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      };

      pool.execute
        .mockResolvedValueOnce([[]]) // email check
        .mockResolvedValueOnce([[]]) // username check
        .mockResolvedValueOnce([{ insertId: 1 }]) // insert
        .mockResolvedValueOnce([[{ id: 1 }]]); // get user

      jwt.sign.mockReturnValue('token123');

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'User registered successfully',
          token: 'token123'
        })
      );
    });
  });

  describe('login', () => {
    test('should reject invalid credentials', async () => {
      req.body = { email: 'test@example.com', password: 'wrong' };
      pool.execute.mockResolvedValueOnce([[]]);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should login successfully', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'password123'
      };

      pool.execute.mockResolvedValueOnce([[mockUser]]);
      jwt.sign.mockReturnValue('token123');

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Login successful',
          token: 'token123'
        })
      );
    });

    test('should handle server error', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      pool.execute.mockRejectedValue(new Error('DB error'));

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});