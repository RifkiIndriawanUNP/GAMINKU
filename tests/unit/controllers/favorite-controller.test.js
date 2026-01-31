const { pool } = require('../../../config/database');
const {
  addFavorite,
  getFavorites,
  removeFavorite
} = require('../../../controllers/favorite-controller');

// Mock
jest.mock('../../../config/database', () => ({
  pool: { execute: jest.fn() }
}));

jest.mock('../../../models/favorite-model', () => 
  jest.fn(f => ({ ...f, game_data: JSON.parse(f.game_data) }))
);

describe('Favorite Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { user: { userId: 1 }, body: {}, params: {} };
    res = { status: jest.fn(() => res), json: jest.fn() };
    jest.clearAllMocks();
  });

  test('should add favorite', async () => {
    req.body = { gameId: 123, gameData: { name: 'Test Game' } };
    pool.execute
      .mockResolvedValueOnce([[]]) 
      .mockResolvedValueOnce([{ affectedRows: 1 }]); 

    await addFavorite(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('should get favorites', async () => {
    const mockFavorites = [{
      id: 1,
      game_id: 123,
      game_data: JSON.stringify({ name: 'Game 1' })
    }];
    pool.execute.mockResolvedValueOnce([mockFavorites]);

    await getFavorites(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ favorites: expect.any(Array) })
    );
  });

  test('should remove favorite', async () => {
    req.params.gameId = '123';
    pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await removeFavorite(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('should handle already exists', async () => {
    req.body = { gameId: 123 };
    pool.execute.mockResolvedValueOnce([[{ id: 1 }]]); 

    await addFavorite(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});