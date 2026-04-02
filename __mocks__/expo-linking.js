module.exports = {
  createURL: jest.fn((path) => `recipeme://${path}`),
  openURL: jest.fn(),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
};
