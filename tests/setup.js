/**
 * Jest setup file - runs before each test file
 * Configure the testing environment before tests run
 */

// Mock browser globals
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock fetch API
global.fetch = jest.fn();

// Mock window location
const locationMock = {
  assign: jest.fn(),
  reload: jest.fn(),
  replace: jest.fn(),
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: ''
};

Object.defineProperty(window, 'location', {
  value: locationMock,
  writable: true
});

// Mock Chart.js to prevent errors
jest.mock('chart.js', () => ({
  Chart: jest.fn(),
  register: jest.fn(),
  getChart: jest.fn()
}));

// Mock feather icons
global.feather = {
  replace: jest.fn()
};

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0]?.includes && args[0].includes('Warning:')) {
    return;
  }
  originalConsoleError(...args);
};
