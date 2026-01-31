// Suppress dotenv debug logs completely
process.env.DOTENV_CONFIG_DEBUG = 'false';

// Mock dotenv _log function before requiring anything
jest.mock('dotenv', () => {
  const originalModule = jest.requireActual('dotenv');
  return {
    ...originalModule,
    config: jest.fn(() => ({
      parsed: {
        NODE_ENV: 'test',
        JWT_SECRET: 'test_jwt_secret_12345',
        RAWG_API_KEY: 'test_rawg_key_12345'
      }
    }))
  };
});

// Setup environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_12345';
process.env.RAWG_API_KEY = 'test_rawg_key_12345';

// Mock ALL console methods
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn()
};

afterEach(() => {
  jest.clearAllMocks();
});