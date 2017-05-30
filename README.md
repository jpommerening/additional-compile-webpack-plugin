# additional-compile-webpack-plugin

> Yo dawg!
> I put a compiler in your compiler, so you can compile ~while~ _after_ you compile!

This plugin enables you to start another compile step with access to the
output of the main compilation.

For example, if your current `webpack` setup generates `dist/lib.js`, with this
plugin you can configure a child compilation step that executes after
`dist/lib.js` has been built, so you can `require()` it.

# Usage

The plugin expects a `webpack` configuration object during initialization.
Currently only `entry`, `output` and `plugins` are supported. In addition to
that, the child compilation inherits the configuration of the main compilation.

Example:

```js
const AdditionalCompilePlugin = require( 'additional-compile-webpack-plugin' );
const path = require( 'path' );

module.exports = {
  entry: {
    lib: './index.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new PostCompilePlugin({
      entry: {
        example1: './examples/example1.js',
        example2: './examples/example2.js'
      }
    })
  ]
};
```
