import {jest} from '@jest/globals'

const path = require('path');
const { getFrontendPath } = require('../api/src/util/helpers.util');

// Properly mocking the join function
jest.mock('path', () => {
  const originalPath = jest.requireActual('path');
  return {
    ...originalPath,
    join: jest.fn(() => 'mocked/path'),
  };
});

describe('getFrontendPath', () => {
  const originalEnv = process.env;
  const originalArgv = process.argv;

  beforeEach(() => {
    jest.resetModules(); // Clears any previous settings
    process.env = { ...originalEnv }; // Make a copy of the original environment variables
    process.argv = [...originalArgv]; // Make a copy of the original argv
    path.join.mockImplementation((...args) => args.join('/')); // Mock implementation of path.join
  });

  afterEach(() => {
    process.env = originalEnv; // Restore original environment
    process.argv = originalArgv; // Restore original argv
  });

  test('should return frontend path from environment variable', () => {
    process.env.FRONTEND = '/env/path/to/frontend';
    expect(getFrontendPath()).toBe('/env/path/to/frontend/');
  });

  test('should return frontend path from CLI argument', () => {
    process.argv.push('--frontend-path', '/cli/path/to/frontend');
    expect(getFrontendPath()).toBe('/cli/path/to/frontend/');
  });

  test('should return default frontend path if no env or cli arg is provided', () => {
    const cwd = process.cwd();
    const defaultPath = `${path.join(cwd, 'frontend')}/`;
    expect(getFrontendPath()).toBe(defaultPath);
  });
});
