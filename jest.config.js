module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.mjs'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};