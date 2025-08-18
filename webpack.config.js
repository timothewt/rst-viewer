const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  devtool: false,
  entry: { content: "./src/content.js", background: "./src/background.js" },
  output: {
    publicPath: "",
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json" },
        { from: "src/rst-styles.css" },
        { from: "src/popup.html" },
        { from: "src/popup.js" },
        { from: "icons", to: "icons" },
      ],
    }),
  ],
};

