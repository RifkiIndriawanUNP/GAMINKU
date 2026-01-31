const createGame = require('../../../models/game-model');

describe('Game Model', () => {
  test('should create game object', () => {
    const gameData = {
      id: 1,
      name: 'Test Game',
      background_image: 'image.jpg',
      rating: 4.5
    };

    const game = createGame(gameData);

    expect(game).toEqual(expect.objectContaining({
      id: 1,
      name: 'Test Game',
      background_image: 'image.jpg',
      rating: 4.5,
      platforms: []
    }));
  });

  test('should handle platforms', () => {
    const gameData = {
      id: 1,
      name: 'Test Game',
      platforms: [
        { platform: { id: 1, name: 'PC' } }
      ]
    };

    const game = createGame(gameData);

    expect(game.platforms).toHaveLength(1);
    expect(game.platforms[0].platform.name).toBe('PC');
  });
});