const { resolve } = require("path");
const webpack = require("webpack");
const MinaEntryPlugin = require("@tinajs/mina-entry-webpack-plugin");
const MinaRuntimePlugin = require("@tinajs/mina-runtime-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const isProduction = process.env.NODE_ENV === "production";

const loaders = {
  script: "babel-loader",
  style: {
    loader: "postcss-loader",
    options: {
      config: {
        path: resolve("./postcss.config.js")
      }
    }
  }
};

module.exports = {
  context: resolve("src"),
  entry: "./app",
  output: {
    path: resolve("dist"),
    filename: "[name]",
    publicPath: "/",
    globalObject: "wx"
  },
  module: {
    rules: [
      {
        test: /\.mina$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "@tinajs/mina-loader",
            options: {
              loaders
            }
          }
        ]
      },
      {
        test: /\.mina$/,
        include: /node_modules/,
        use: "@tinajs/mina-loader"
      },
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: loaders.script
      },
      {
        test: /\.(css|wxss)$/,
        exclude: /node_modules/,
        use: loaders.style
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: {
          loader: "file-loader",
          options: {
            name: "assets/[name].[hash:6].[ext]"
          }
        }
      },
      {
        test: /\.wxs$/,
        use: {
          loader: "@tinajs/wxs-loader",
          options: {
            name: "wxs/[name].[hash:6].[ext]"
          }
        }
      },
      {
        test: /\.wxml$/,
        use: [
          {
            loader: "relative-file-loader",
            options: {
              name: "wxml/[name].[hash:6].[ext]"
            }
          },
          {
            loader: "@tinajs/wxml-loader",
            options: {
              raw: true,
              enforceRelativePath: true,
              root: resolve("src")
            }
          }
        ]
      }
    ]
  },
  resolve: {
    symlinks: true,
    extensions: [".ts", ".js"]
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: "development",
      DEBUG: false
    }),
    new CopyPlugin(["./sitemap.json"]),
    new MinaEntryPlugin(),
    new MinaRuntimePlugin()
  ],
  optimization: {
    splitChunks: {
      chunks: "all",
      name: "common.js",
      minChunks: 2,
      minSize: 0
    },
    runtimeChunk: {
      name: "runtime.js"
    }
  },
  mode: isProduction ? "production" : "none",
  devtool: isProduction ? "source-map" : "inline-source-map"
};
