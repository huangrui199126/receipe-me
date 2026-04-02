const React = require('react');

module.exports = {
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
  Link: ({ children }) => children,
};
