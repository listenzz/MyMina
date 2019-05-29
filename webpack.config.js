const { resolve } = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const MinaWebpackPlugin = require("./plugin/MinaWebpackPlugin");
const MinaRuntimePlugin = require("@tinajs/mina-runtime-webpack-plugin");

const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  context: resolve("src"),
  entry: "./app.js",
  output: {
    path: resolve("dist"),
    filename: "[name].js",
    globalObject: "wx"
  },
  resolve: {
    symlinks: true,
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: "babel-loader"
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin(["**/*.!(ts|js)"]),
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false
    }),
    new MinaWebpackPlugin(),
    new MinaRuntimePlugin()
  ],
  optimization: {
    splitChunks: {
      chunks: "all",
      name: "common",
      minChunks: 2,
      minSize: 0
    },
    runtimeChunk: {
      name: "runtime"
    }
  },
  mode: isProduction ? "production" : "none",
  devtool: isProduction ? "source-map" : "inline-source-map"
};
