const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/index.ts',
  target: 'node',
  externals: [nodeExternals()], // exclude node_modules from the bundle
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,  // Skip type checking
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.cjs',
    path: path.resolve(__dirname, 'dist'),
    clean: true, // Clean the output directory before each build
  },
  mode: 'production', // or 'development' depending on your needs
};
