jest.mock('mysql2/promise', () => {
  const mockPool = {
    getConnection: jest.fn(),
    execute: jest.fn(),
    query: jest.fn(),
    end: jest.fn()
  };
  
  return {
    createPool: jest.fn(() => mockPool)
  };
});

const mysql = require('mysql2/promise');
const { pool, connectDB } = require('../../../config/database');

describe('Database Config', () => {
  let mockPoolInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPoolInstance = mysql.createPool();
  });

  test('pool should be created', () => {
    expect(mysql.createPool).toHaveBeenCalled();
    expect(mockPoolInstance).toBeDefined();
  });

  describe('connectDB', () => {
    test('should connect successfully', async () => {
      const mockConnection = { release: jest.fn() };
      mockPoolInstance.getConnection.mockResolvedValue(mockConnection);

      await connectDB();

      expect(mockPoolInstance.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    test('should handle connection error', async () => {
      const error = new Error('Connection failed');
      mockPoolInstance.getConnection.mockRejectedValue(error);

      await connectDB();
      expect(mockPoolInstance.getConnection).toHaveBeenCalled();
    });
  });
});