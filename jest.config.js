/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  verbose: true,
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/jest/setEnv.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest/singleton.ts'],
};
