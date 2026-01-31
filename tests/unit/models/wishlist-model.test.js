const createWishlist = require('../../../models/wishlist-model');

describe('Wishlist Model', () => {
  test('should create wishlist object with parsed game_data', () => {
    const mockWishlist = {
      id: 1,
      user_id: 1,
      game_id: 123,
      game_data: JSON.stringify({ name: 'Test Game', id: 123 }),
      created_at: '2024-01-01T00:00:00.000Z'
    };

    const wishlist = createWishlist(mockWishlist);

    expect(wishlist).toEqual({
      id: 1,
      user_id: 1,
      game_id: 123,
      game_data: { name: 'Test Game', id: 123 },
      created_at: '2024-01-01T00:00:00.000Z'
    });
  });

  test('should handle empty game_data', () => {
    const mockWishlist = {
      id: 1,
      user_id: 1,
      game_id: 123,
      game_data: '{}',
      created_at: '2024-01-01T00:00:00.000Z'
    };

    const wishlist = createWishlist(mockWishlist);

    expect(wishlist.game_data).toEqual({});
  });
});