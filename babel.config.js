/**
 * Babel configuration for OrderForecast project
 * Enables proper transpilation of ES6+ features for testing
 */

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
          browsers: [
            'last 2 Chrome versions',
            'last 2 Firefox versions',
            'last 2 Safari versions',
            'last 2 Edge versions'
          ]
        },
        modules: 'auto',
        useBuiltIns: 'usage',
        corejs: 3
      }
    ]
  ],
  plugins: []
};
