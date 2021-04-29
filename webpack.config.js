const path = require('path');
const NpmDtsPlugin = require('npm-dts-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  target: 'es6',
  mode: 'production',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.(js|jsx|tsx|ts)$/,
        use: 'ts-loader',
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new NpmDtsPlugin({
      entry: './src/index',
      output: './dist/index.d.ts'
    }),
    new CopyPlugin({
      patterns: [
        { from: "module-package.json", to: "package.json" },
        { from: "README.md", to: "README.md" }
      ],
    }),
  ],
  experiments: {
    outputModule: true
  },
  output: {
    filename: 'index.mjs',
    path: path.resolve('./dist'),
    libraryTarget: 'module'
  },
  optimization: {
    minimize: false
  }
};