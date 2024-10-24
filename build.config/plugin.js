const { withSentryConfig } = require('@sentry/nextjs');
const sentryWebpackPluginOptions = {
  silent: true,
  include: '.next',
  configFile: '.sentryclirc',
  urlPrefix: '~/_next',
  hideSourceMaps: true,
  disableLogger: true,
  autoInstrumentMiddleware: false,
};
module.exports = [(nextConfig) => withSentryConfig(nextConfig, sentryWebpackPluginOptions)];
