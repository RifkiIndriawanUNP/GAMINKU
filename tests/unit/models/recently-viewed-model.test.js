const createRecentlyViewed = require('../../../models/recently-viewed-model');

describe('Recently Viewed Model', () => {
  test('should create recently viewed object with parsed game_data', () => {
    const mockItem = {
      id: 1,
      user_id: 1,
      game_id: 123,
      game_data: JSON.stringify({ name: 'Test Game', id: 123 }),
      viewed_at: '2024-01-01T00:00:00.000Z'
    };

    const item = createRecentlyViewed(mockItem);

    expect(item).toEqual({
      id: 1,
      user_id: 1,
      game_id: 123,
      game_data: { name: 'Test Game', id: 123 },
      viewed_at: '2024-01-01T00:00:00.000Z'
    });
  });

  test('should handle null values', () => {
    const mockItem = {
      id: 1,
      user_id: 1,
      game_id: 123,
      game_data: null,
      viewed_at: null
    };

    const item = createRecentlyViewed(mockItem);

    expect(item).toEqual({
      id: 1,
      user_id: 1,
      game_id: 123,
      game_data: null,
      viewed_at: null
    });
  });
});