const { pool } = require('../../../config/database');
const {
  addRecentlyViewed,
  getRecentlyViewed,
  clearRecentlyViewed
} = require('../../../controllers/recently-viewed-controller');

// Mock
jest.mock('../../../config/database', () => ({
  pool: { execute: jest.fn() }
}));

jest.mock('../../../models/recently-viewed-model', () => 
  jest.fn(r => ({ ...r, game_data: JSON.parse(r.game_data) }))
);

describe('Recently Viewed Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { user: { userId: 1 }, body: {}, params: {} };
    res = { status: jest.fn(() => res), json: jest.fn() };
    jest.clearAllMocks();
  });

  test('should add to recently viewed', async () => {
    req.body = { gameId: 123 };
    pool.execute
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 0 }]);

    await addRecentlyViewed(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('should get recently viewed', async () => {
    pool.execute.mockResolvedValueOnce([[]]);

    await getRecentlyViewed(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('should clear recently viewed', async () => {
    pool.execute.mockResolvedValueOnce([{ affectedRows: 2 }]);

    await clearRecentlyViewed(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});