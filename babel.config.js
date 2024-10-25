const nextModeBabelPlugin = require('next-babel-conditional-ssg-ssr');

const presets = ['next/babel'];

module.exports = {
  presets,
  plugins: [
    ...(process.env.SKIP_SSR ? [nextModeBabelPlugin('ssg')] : []),
    // ['import', { libraryName: 'antd', libraryDirectory: 'lib', style: 'css' }, 'antd'],
    [
      'import',
      {
        libraryName: 'lodash',
        libraryDirectory: '',
        camel2DashComponentName: false, // default: true
      },
      'lodash',
    ],
    [
      'import',
      {
        libraryName: 'date-fns',
        libraryDirectory: '',
        camel2DashComponentName: false, // default: true
      },
      'date-fns',
    ],
  ],
};
