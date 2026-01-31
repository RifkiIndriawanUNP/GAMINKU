const { cache, getCachedData, cacheMiddleware } = require('../../../config/cache');

// Mock
jest.mock('../../../middlewares/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('Cache Config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('cache instance should exist', () => {
    expect(cache).toBeDefined();
  });

  describe('getCachedData', () => {
    test('should return cached data', async () => {
      const mockData = { id: 1 };
      cache.get = jest.fn().mockReturnValue(mockData);
      const fetchFn = jest.fn();

      const result = await getCachedData('test', fetchFn);

      expect(result).toEqual(mockData);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    test('should fetch and cache when no cache', async () => {
      cache.get = jest.fn().mockReturnValue(null);
      cache.set = jest.fn();
      const mockData = { id: 2 };
      const fetchFn = jest.fn().mockResolvedValue(mockData);

      const result = await getCachedData('test', fetchFn);

      expect(result).toEqual(mockData);
      expect(fetchFn).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith('test', mockData, 300);
    });
  });
});