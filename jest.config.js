/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  verbose: true,
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/jest/setup/auth.ts'],
  globalTeardown: '<rootDir>/tests/jest/global/tear-down.ts',
  globalSetup: '<rootDir>/tests/jest/global/setup.ts',
};
