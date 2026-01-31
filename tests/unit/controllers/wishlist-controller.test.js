const { pool } = require('../../../config/database');
const {
  addWishlist,
  getWishlist,
  removeWishlist
} = require('../../../controllers/wishlist-controller');

// Mock
jest.mock('../../../config/database', () => ({
  pool: { execute: jest.fn() }
}));

jest.mock('../../../models/wishlist-model', () => 
  jest.fn(w => ({ 
    ...w, 
    game_data: w.game_data 
  }))
);

describe('Wishlist Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { user: { userId: 1 }, body: {}, params: {} };
    res = { status: jest.fn(() => res), json: jest.fn() };
    jest.clearAllMocks();
  });

  test('should add to wishlist', async () => {
    req.body = { gameId: 123 };
    pool.execute
      .mockResolvedValueOnce([[]]) 
      .mockResolvedValueOnce([{ affectedRows: 1 }]); 

    await addWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('should get wishlist', async () => {
    const mockWishlist = [{
      id: 1,
      user_id: 1,
      game_id: 123,
      game_data: JSON.stringify({ name: 'Game 1' }),
      created_at: '2024-01-01T00:00:00.000Z'
    }];
    pool.execute.mockResolvedValueOnce([mockWishlist]);

    await getWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      wishlist: expect.any(Array)
    });
  });

  test('should remove from wishlist', async () => {
    req.params.gameId = '123';
    pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await removeWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});