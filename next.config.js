/** @type {import('next').NextConfig} */
const withPlugins = require('next-compose-plugins');
const { NEXT_PUBLIC_APP_ENV } = process.env;
const pluginConfig = require('./build.config/plugin');
const development = require('./build.config/development');
const production = require('./build.config/production');

const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({
        enabled: true,
      })
    : (x) => x;
const config = NEXT_PUBLIC_APP_ENV === 'production' ? production : development;

module.exports = withPlugins(
  pluginConfig,
  withBundleAnalyzer({
    ...config,
    // output: 'standalone',  // TODO after updating Dockerfile
  }),
);
