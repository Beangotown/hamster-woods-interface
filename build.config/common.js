const rewritesConfig = require('./rewrites/index');

module.exports = {
  reactStrictMode: true,
  async rewrites() {
    console.log('rewrites===', rewritesConfig);
    return rewritesConfig;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.com',
      },
    ],
  },
  productionBrowserSourceMaps: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    config.ignoreWarnings = [{ module: /node_modules/ }];
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    forceSwcTransforms: false,
    // TODO - doesn't seem to work?
    optimizePackageImports: ['lodash', 'react-use'],
  },
};
