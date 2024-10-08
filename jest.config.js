/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  verbose: true,
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/jest/setup/setEnv.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest/setup/singleton.ts'],
  globalTeardown: '<rootDir>/tests/jest/tearDown.ts',
};
