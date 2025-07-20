const webpack = require('webpack');
const path = require('path');

module.exports = {
  resolve: {
    fallback: {
      buffer: require.resolve('buffer'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util'),
      url: require.resolve('url'),
      assert: require.resolve('assert'),
      process: require.resolve('process/browser'),
    },
    alias: {
      'process/browser': require.resolve('process/browser'),
    },
    extensionAlias: {
      '.js': ['.js', '.ts'],
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
}; 