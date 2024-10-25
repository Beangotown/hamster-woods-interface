const { withSentryConfig } = require('@sentry/nextjs');
const sentryWebpackPluginOptions = {
  silent: true,
  include: '.next',
  configFile: '.sentryclirc',
  urlPrefix: '~/_next',
};
module.exports = [(nextConfig) => withSentryConfig(nextConfig, sentryWebpackPluginOptions)];
