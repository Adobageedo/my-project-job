import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest-e2e.setup.ts'],
  testTimeout: 60000, // 60s timeout pour les appels API
  verbose: true,
};

export default config;
