# RST Viewer

Install on [Chrome](https://chromewebstore.google.com/detail/rst-viewer/olaapelnbekgffephiefnolondnknkeh)

A browser extension that automatically renders reStructuredText (.rst) files as formatted HTML when viewed in your browser.

## What it does

When you open a `.rst` file in your browser (either locally or from a web server), this extension detects the file and converts it from plain text markup to a nicely formatted document with proper typography, syntax highlighting for code blocks, and clean styling.

## Installation

### From source

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in your browser:
   - **Chrome**: Go to `chrome://extensions/`, enable Developer mode, click "Load unpacked" and select the `dist` folder

## Browser compatibility

For the moment, it has been implemented for chrome only.

## Acknowledgments

This extension uses the [rst-compiler](https://www.npmjs.com/package/rst-compiler) package for converting reStructuredText to HTML. Special thanks to the maintainers of that project for making RST parsing accessible in JavaScript.

## License

This project is licensed under Apache 2.0.
