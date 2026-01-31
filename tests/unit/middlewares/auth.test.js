const jwt = require('jsonwebtoken');
const { auth, authorize } = require('../../../middlewares/auth');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { header: jest.fn() };
    res = { status: jest.fn(() => res), json: jest.fn() };
    next = jest.fn();
  });

  describe('auth', () => {
    test('should reject without token', () => {
      req.header.mockReturnValue(null);

      auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should accept valid token', () => {
      req.header.mockReturnValue('Bearer valid.token');
      jwt.verify.mockReturnValue({ userId: 1 });

      auth(req, res, next);

      expect(req.user).toEqual({ userId: 1 });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    test('should allow admin role', () => {
      req.user = { role: 'admin' };
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should reject user role for admin route', () => {
      req.user = { role: 'user' };
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});