const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        buffer: require.resolve('buffer'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util'),
        url: require.resolve('url'),
        assert: require.resolve('assert'),
        process: require.resolve('process/browser'),
      };
      
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
      ];
      
      // Fix for module resolution in newer packages
      webpackConfig.resolve.extensionAlias = {
        '.js': ['.js', '.ts'],
      };
      
      // Handle ESM module resolution
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'process/browser': require.resolve('process/browser'),
      };
      
      // Fix for "fullySpecified" ESM resolution errors
      webpackConfig.module.rules = [
        ...webpackConfig.module.rules,
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false,
          },
        },
      ];
      
      return webpackConfig;
    },
  },
}; 