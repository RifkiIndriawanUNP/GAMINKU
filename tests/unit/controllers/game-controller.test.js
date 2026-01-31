const rawg = require('../../../config/rawg');
const { getCachedData } = require('../../../config/cache');
const { 
  searchGames, 
  getPopularGames,
  getHighestRatedGames,
  getUpcomingGames,
  getGameDetailsByName,
  getGamesAZ,
  getAbout,
  getPCGames,
  getPlayStationGames,
  getXboxGames,
  getNintendoGames,
  getMobileGames
} = require('../../../controllers/game-controller');

// Mock
jest.mock('../../../config/rawg', () => ({ get: jest.fn() }));
jest.mock('../../../config/cache', () => ({ getCachedData: jest.fn() }));
jest.mock('../../../middlewares/logger', () => ({ 
  info: jest.fn(), 
  error: jest.fn(),
  warn: jest.fn() 
}));
jest.mock('../../../models/game-model', () => jest.fn(game => ({
  ...game,
  id: game.id,
  name: game.name
})));

describe('Game Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {}, params: {} };
    res = { status: jest.fn(() => res), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('searchGames', () => {
    test('should reject without search query', async () => {
      await searchGames(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Search query required!' });
    });

    test('should search successfully', async () => {
      req.query = { search: 'elden ring', page: '1' };
      const mockGames = [{ id: 1, name: 'Elden Ring' }];
      rawg.get.mockResolvedValue({
        data: { count: 1, results: mockGames }
      });

      await searchGames(req, res);

      expect(rawg.get).toHaveBeenCalledWith('/games', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1 })
      );
    });

    test('should use default page if not provided', async () => {
      req.query = { search: 'elden ring' };
      rawg.get.mockResolvedValue({
        data: { count: 0, results: [] }
      });

      await searchGames(req, res);

      expect(rawg.get).toHaveBeenCalledWith('/games', expect.objectContaining({
        params: expect.objectContaining({ page: 1 })
      }));
    });

    test('should handle API error', async () => {
      req.query = { search: 'elden ring' };
      rawg.get.mockRejectedValue(new Error('API Error'));

      await searchGames(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Failed to search games' });
    });
  });

  describe('getPopularGames', () => {
    test('should return popular games', async () => {
      const mockGames = [{ id: 1, name: 'Popular Game' }];
      getCachedData.mockResolvedValue(mockGames);

      await getPopularGames(req, res);

      expect(getCachedData).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Popular Games' })
      );
    });

    test('should handle cache error', async () => {
      getCachedData.mockRejectedValue(new Error('Cache error'));

      await getPopularGames(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Failed to fetch popular games' });
    });

    test('should fetch from API when no cache', async () => {
      const mockGames = [{ id: 1, name: 'Game' }];
      getCachedData.mockImplementation((key, fetchFn, ttl) => fetchFn());

      rawg.get.mockResolvedValue({
        data: { results: mockGames }
      });

      await getPopularGames(req, res);

      expect(rawg.get).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getHighestRatedGames', () => {
    test('should return highest rated games', async () => {
      const mockGames = [{ id: 1, name: 'Top Rated Game' }];
      getCachedData.mockResolvedValue(mockGames);

      await getHighestRatedGames(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Highest Rated Games' })
      );
    });

    test('should handle error', async () => {
      getCachedData.mockRejectedValue(new Error('Error'));

      await getHighestRatedGames(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Failed to fetch highest rated games' });
    });
  });

  describe('getUpcomingGames', () => {
    test('should return upcoming games', async () => {
      const mockGames = [{ id: 1, name: 'Upcoming Game', released: '2024-12-31' }];
      getCachedData.mockResolvedValue(mockGames);

      await getUpcomingGames(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Upcoming Games' })
      );
    });

    test('should handle API error', async () => {
      getCachedData.mockRejectedValue(new Error('API Error'));

      await getUpcomingGames(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('should filter future games when fetched from API', async () => {
      const futureGame = { 
        id: 1, 
        name: 'Future Game', 
        released: '2024-12-31' 
      };
      const pastGame = { 
        id: 2, 
        name: 'Past Game', 
        released: '2020-01-01' 
      };
      
      getCachedData.mockImplementation((key, fetchFn, ttl) => fetchFn());
      rawg.get.mockResolvedValue({
        data: { results: [futureGame, pastGame] }
      });

      await getUpcomingGames(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getGameDetailsByName', () => {
    test('should reject without game name', async () => {
      await getGameDetailsByName(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Game name required!' });
    });

    test('should return game details from cache', async () => {
      req.params = { name: 'elden-ring' };
      const mockDetails = { 
        id: 1, 
        name: 'Elden Ring',
        slug: 'elden-ring'
      };
      getCachedData.mockResolvedValue(mockDetails);

      await getGameDetailsByName(req, res);

      expect(getCachedData).toHaveBeenCalledWith(
        'game_details_elden-ring',
        expect.any(Function),
        3600
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockDetails);
    });

    test('should handle game not found in cache', async () => {
      req.params = { name: 'invalid' };
      getCachedData.mockResolvedValue(null);

      await getGameDetailsByName(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Game not found' });
    });

    test('should fetch from API when no cache', async () => {
      req.params = { name: 'elden ring' };
      const mockGameDetails = {
        id: 1,
        name: 'Elden Ring',
        slug: 'elden-ring'
      };
      
      getCachedData.mockImplementation((key, fetchFn, ttl) => fetchFn());
      
      rawg.get
        .mockResolvedValueOnce({ // Game details
          data: {
            id: 1,
            name: 'Elden Ring',
            slug: 'elden-ring',
            description_raw: 'Test description',
            released: '2022-02-25',
            background_image: 'image.jpg',
            rating: 4.5,
            rating_top: 5,
            playtime: 50,
            esrb_rating: { name: 'Mature' },
            platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }],
            genres: [{ id: 1, name: 'Action', slug: 'action' }],
            developers: [{ id: 1, name: 'FromSoftware', slug: 'fromsoftware' }],
            publishers: [{ id: 1, name: 'Bandai Namco', slug: 'bandai-namco' }],
            tags: [{ id: 1, name: 'Souls-like', slug: 'souls-like' }],
            stores: [{ id: 1, store: { id: 1, name: 'Steam', domain: 'store.steampowered.com' } }]
          }
        })
        .mockResolvedValueOnce({ // Screenshots
          data: { results: [{ id: 1, image: 'screenshot.jpg' }] }
        })
        .mockRejectedValueOnce({ // Series - will fail gracefully
          response: { status: 404 }
        });

      await getGameDetailsByName(req, res);

      expect(rawg.get).toHaveBeenCalledTimes(3); // Game, screenshots, series
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle API 404 error', async () => {
      req.params = { name: 'non-existent-game' };
      getCachedData.mockImplementation((key, fetchFn, ttl) => {
        const error = new Error('Not Found');
        error.response = { status: 404 };
        throw error;
      });

      await getGameDetailsByName(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should handle general API error', async () => {
      req.params = { name: 'elden-ring' };
      getCachedData.mockImplementation((key, fetchFn, ttl) => {
        throw new Error('API Error');
      });

      await getGameDetailsByName(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('should convert game name to slug format', async () => {
      req.params = { name: 'Elden Ring: Shadow of the Erdtree' };
      getCachedData.mockImplementation((key, fetchFn, ttl) => fetchFn());
      
      rawg.get.mockResolvedValue({ data: {} });

      await getGameDetailsByName(req, res);

      // Check that the slug was called with correct format
      expect(rawg.get).toHaveBeenCalledWith(
        '/games/elden-ring-shadow-of-the-erdtree',
        expect.any(Object)
      );
    });
  });

  describe('getGamesAZ', () => {
    test('should reject invalid letter', async () => {
      req.params = { letter: '1' };
      
      await getGamesAZ(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false });
    });

    test('should reject empty letter', async () => {
      req.params = { letter: '' };
      
      await getGamesAZ(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return games for valid letter', async () => {
      req.params = { letter: 'A' };
      const mockGames = [
        { id: 1, name: 'Assassin\'s Creed', slug: 'assassins-creed', rating: 4.5, background_image: 'image.jpg' },
        { id: 2, name: 'Animal Crossing', slug: 'animal-crossing', rating: 4.8, background_image: 'image2.jpg' }
      ];
      
      rawg.get.mockResolvedValue({
        data: { results: mockGames }
      });

      await getGamesAZ(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          letter: 'A',
          count: 2
        })
      );
    });

    test('should filter games by first letter', async () => {
      req.params = { letter: 'B' };
      const mockGames = [
        { id: 1, name: 'Batman: Arkham City' },
        { id: 2, name: 'Call of Duty' },
        { id: 3, name: 'Bioshock Infinite' }
      ];
      
      rawg.get.mockResolvedValue({
        data: { results: mockGames }
      });

      await getGamesAZ(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 2, 
          letter: 'B'
        })
      );
    });

    test('should handle API error', async () => {
      req.params = { letter: 'C' };
      rawg.get.mockRejectedValue(new Error('API Error'));

      await getGamesAZ(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle games without name', async () => {
      req.params = { letter: 'D' };
      const mockGames = [
        { id: 1, name: 'Dark Souls' },
        { id: 2, name: null }, 
        { id: 3 } 
      ];
      
      rawg.get.mockResolvedValue({
        data: { results: mockGames }
      });

      await getGamesAZ(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1 // Dark Souls
        })
      );
    });
  });

  describe('Platform-specific games', () => {
    const platformTests = [
      { name: 'getPCGames', function: getPCGames, platform: 'PC Games' },
      { name: 'getPlayStationGames', function: getPlayStationGames, platform: 'PlayStation Games' },
      { name: 'getXboxGames', function: getXboxGames, platform: 'Xbox Games' },
      { name: 'getNintendoGames', function: getNintendoGames, platform: 'Nintendo Games' },
      { name: 'getMobileGames', function: getMobileGames, platform: 'Mobile Games' }
    ];

    platformTests.forEach(({ name, function: func, platform }) => {
      describe(name, () => {
        test(`should return ${platform}`, async () => {
          const mockGames = [{ id: 1, name: `${platform} Game` }];
          getCachedData.mockResolvedValue(mockGames);

          await func(req, res);

          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ platform })
          );
        });

        test(`should handle error for ${platform}`, async () => {
          getCachedData.mockRejectedValue(new Error('Cache Error'));

          await func(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: expect.stringContaining('Failed to fetch') })
          );
        });

        test(`should fetch from API when no cache for ${platform}`, async () => {
          const mockGames = [{ id: 1, name: 'Game' }];
          getCachedData.mockImplementation((key, fetchFn, ttl) => fetchFn());
          rawg.get.mockResolvedValue({
            data: { results: mockGames }
          });

          await func(req, res);

          expect(rawg.get).toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(200);
        });
      });
    });
  });

  describe('getAbout', () => {
    test('should return about info', () => {
      getAbout(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ 
          success: true,
          title: 'About gaminku',
          version: '2.0.0'
        })
      );
    });
  });
});