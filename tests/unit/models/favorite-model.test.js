const createFavorite = require('../../../models/favorite-model');

describe('Favorite Model', () => {
  test('should create favorite object with parsed game_data', () => {
    const mockFavorite = {
      id: 1,
      user_id: 1,
      game_id: 123,
      game_data: JSON.stringify({ name: 'Test Game', id: 123 }),
      created_at: '2024-01-01T00:00:00.000Z'
    };

    const favorite = createFavorite(mockFavorite);

    expect(favorite).toEqual({
      id: 1,
      user_id: 1,
      game_id: 123,
      game_data: { name: 'Test Game', id: 123 },
      created_at: '2024-01-01T00:00:00.000Z'
    });
  });

  test('should handle invalid JSON gracefully', () => {
    const mockFavorite = {
      id: 1,
      user_id: 1,
      game_id: 123,
      game_data: 'invalid-json',
      created_at: '2024-01-01T00:00:00.000Z'
    };

    const favorite = createFavorite(mockFavorite);

    expect(favorite.game_data).toBe('invalid-json');
  });
});