const { pool } = require('../../../config/database');
const {
  getProfile,
  updateProfile,
  deleteAccount,
  getAllUsers,
  deleteUserById
} = require('../../../controllers/user-controller');

// Mock dependencies
jest.mock('../../../config/database', () => ({
  pool: {
    execute: jest.fn()
  }
}));

jest.mock('../../../models/user-model', () => 
  jest.fn(user => ({
    ...user,
    role: user.role || 'user'
  }))
);

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { userId: 1, role: 'user' },
      body: {},
      params: {}
    };
    res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    test('should return user profile successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        avatar_url: null,
        created_at: '2024-01-01'
      };

      pool.execute.mockResolvedValueOnce([[mockUser]]);

      await getProfile(req, res);

      expect(pool.execute).toHaveBeenCalledWith(
        'SELECT id, username, email, avatar_url, created_at FROM users WHERE id = ?',
        [1]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, username: 'testuser' })
      );
    });

    test('should return 404 if user not found', async () => {
      pool.execute.mockResolvedValueOnce([[]]);

      await getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'User not found' });
    });

    test('should handle database error', async () => {
      pool.execute.mockRejectedValueOnce(new Error('DB Error'));

      await getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Failed to get profile' });
    });
  });

  describe('updateProfile', () => {
    test('should update profile successfully with username only', async () => {
      req.body = { username: 'newusername' };
      
      // User check
      pool.execute
        .mockResolvedValueOnce([[{ id: 1 }]]) 
        .mockResolvedValueOnce([[]]) 
        .mockResolvedValueOnce([{ affectedRows: 1 }]) 
        .mockResolvedValueOnce([[{ 
          id: 1,
          username: 'newusername',
          email: 'test@example.com',
          avatar_url: null,
          created_at: '2024-01-01'
        }]]);

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Profile updated successfully',
        user: expect.any(Object)
      });
    });

    test('should update profile successfully with email only', async () => {
      req.body = { email: 'new@example.com' };
      
      pool.execute
        .mockResolvedValueOnce([[{ id: 1 }]]) // User exists
        .mockResolvedValueOnce([[]]) // Email available
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Update success
        .mockResolvedValueOnce([[{ id: 1, username: 'cukurukuk', email: 'cihuy@example.com' }]]);

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should update profile successfully with avatar_url only', async () => {
      req.body = { avatar_url: 'https://example.com/avatar.jpg' };
      
      pool.execute
        .mockResolvedValueOnce([[{ id: 1 }]]) 
        .mockResolvedValueOnce([{ affectedRows: 1 }]) 
        .mockResolvedValueOnce([[{ id: 1, username: 'testuser', avatar_url: 'https://example.com/avatar.jpg' }]]);

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should update profile with all fields', async () => {
      req.body = {
        username: 'newuser',
        email: 'new@example.com',
        avatar_url: 'avatar.jpg'
      };
      
      pool.execute
        .mockResolvedValueOnce([[{ id: 1 }]]) 
        .mockResolvedValueOnce([[]]) 
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]) 
        .mockResolvedValueOnce([[{
          id: 1,
          username: 'newuser',
          email: 'new@example.com',
          avatar_url: 'avatar.jpg'
        }]]);

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if user not found', async () => {
      req.body = { username: 'newuser' };
      pool.execute.mockResolvedValueOnce([[]]); 

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'User not found' });
    });

    test('should return 400 if username already taken', async () => {
      req.body = { username: 'takenuser' };
      
      pool.execute
        .mockResolvedValueOnce([[{ id: 1 }]]) 
        .mockResolvedValueOnce([[{ id: 2 }]]); 

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Username already taken' });
    });

    test('should return 400 if email already registered', async () => {
      req.body = { email: 'taken@example.com' };
      
      pool.execute
        .mockResolvedValueOnce([[{ id: 1 }]]) 
        .mockResolvedValueOnce([[{ id: 2 }]]); 

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Email already registered' });
    });

    test('should return 400 if no fields to update', async () => {
      req.body = {}; 

      pool.execute.mockResolvedValueOnce([[{ id: 1 }]]); 

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'No fields to update' });
    });

    test('should return 400 if update fails (affectedRows = 0)', async () => {
      req.body = { username: 'newuser' };
      
      pool.execute
        .mockResolvedValueOnce([[{ id: 1 }]]) 
        .mockResolvedValueOnce([[]]) 
        .mockResolvedValueOnce([{ affectedRows: 0 }]); 

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Update failed' });
    });

    test('should handle database error', async () => {
      req.body = { username: 'newuser' };
      pool.execute.mockRejectedValueOnce(new Error('DB Error'));

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Failed to update profile',
        error: 'DB Error'
      });
    });
  });

  describe('deleteAccount', () => {
    test('should delete account successfully', async () => {
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await deleteAccount(req, res);

      expect(pool.execute).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = ?',
        [1]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Account deleted successfully' });
    });

    test('should handle database error', async () => {
      pool.execute.mockRejectedValueOnce(new Error('DB Error'));

      await deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Failed to delete account' });
    });
  });

  describe('getAllUsers', () => {
    test('should return all users for admin', async () => {
      req.user.role = 'admin';
      const mockUsers = [
        { id: 1, username: 'user1', email: 'user1@example.com', role: 'user' },
        { id: 2, username: 'user2', email: 'user2@example.com', role: 'user' }
      ];

      pool.execute.mockResolvedValueOnce([mockUsers]);

      await getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        users: expect.arrayContaining([
          expect.objectContaining({ id: 1 }),
          expect.objectContaining({ id: 2 })
        ])
      });
    });

    test('should return 403 if not admin', async () => {
      req.user.role = 'user'; 

      await getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Admin access required' });
    });

    test('should handle database error', async () => {
      req.user.role = 'admin';
      pool.execute.mockRejectedValueOnce(new Error('DB Error'));

      await getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Failed to get users' });
    });
  });

  describe('deleteUserById', () => {
    test('should delete user successfully for admin', async () => {
      req.user.role = 'admin';
      req.params.id = 2; 

      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await deleteUserById(req, res);

      expect(pool.execute).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = ?',
        [2]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ msg: 'User deleted successfully' });
    });

    test('should return 403 if not admin', async () => {
      req.user.role = 'user'; 
      req.params.id = 2;

      await deleteUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Admin access required' });
    });

    test('should return 400 if trying to delete self', async () => {
      req.user.role = 'admin';
      req.params.id = 1; // punya atmin

      await deleteUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Cannot delete yourself' });
    });

    test('should handle database error', async () => {
      req.user.role = 'admin';
      req.params.id = 2;
      pool.execute.mockRejectedValueOnce(new Error('DB Error'));

      await deleteUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Failed to delete user' });
    });
  });
});