/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const actual = jest.requireActual('@expo/vector-icons');

  const MockIcon = ({ name, ...props }: { name: string }) =>
    React.createElement(Text, props, name);

  return {
    ...actual,
    Ionicons: Object.assign(MockIcon, { glyphMap: actual.Ionicons.glyphMap }),
  };
});
