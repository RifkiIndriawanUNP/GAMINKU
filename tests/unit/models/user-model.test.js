const createUser = require('../../../models/user-model');

describe('User Model', () => {
  test('should create user object', () => {
    const userData = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com'
    };

    const user = createUser(userData);

    expect(user).toEqual(expect.objectContaining({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    }));
  });

  test('should use provided role', () => {
    const userData = {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin'
    };

    const user = createUser(userData);

    expect(user.role).toBe('admin');
  });
});