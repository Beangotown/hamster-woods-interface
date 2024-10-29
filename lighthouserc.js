module.exports = {
  ci: {
    collect: {
      // Don't run certain audits
      skipAudits: ['redirects-http'],
      // Don't clear localStorage/IndexedDB/etc before loading the page.
      disableStorageReset: true,
      // Wait up to 90s for the page to load
      maxWaitForLoad: 90000,
      // Use applied throttling instead of simulated throttling
      throttlingMethod: 'devtools',
      startServerCommand: 'yarn start',
      url: 'http://localhost:3000/',
    },
    assert: {
      preset: 'lighthouse:no-pwa',
    },
  },
};
