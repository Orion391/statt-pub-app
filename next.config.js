// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,

});

// importa webpack per la ProvidePlugin
const webpack = require('webpack');

module.exports = withPWA({
  reactStrictMode: true,
  webpack(config, { isServer }) {
    // solo per client‐side, altrimenti Next.js già ha process in Node
    if (!isServer) {
      // assicura che importazioni di `process` o `node:process` vadano a browser-polyfill
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        process: require.resolve('process/browser'),
      };
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
        })
      );
    }
    return config;
  },
});