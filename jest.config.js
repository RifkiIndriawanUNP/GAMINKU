module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTest.js'],
  verbose: true,
  automock: false,
  clearMocks: true,
  resetModules: true,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/logs/'
  ]
};