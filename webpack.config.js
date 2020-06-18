const path = require("path");

module.exports = (env) => {
  return {
    entry: {
      app: path.join(__dirname, "src/app.ts"),
    },
    target: "node",
    node: {
      __dirname: false,
      __filename: false
    },
    output: {
      path: path.join(__dirname, "./dist"),
      filename: "[name].bundle.js",
      libraryTarget: 'commonjs',
    },
    resolve: {
      extensions: [".ts", ".js"]
    },
    module: {
      rules: [{
          test: /\.ts$/,
          enforce: 'pre',
          loader: 'tslint-loader',
          options: {}
        },
        {
          test: /\.ts?$/,
          loader: "ts-loader"
        },
      ]
    },
    externals: ['serialport', 'rpio'],
    devtool: 'source-map',
  };
};
