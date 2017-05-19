'use strict';

const EntryOptionPlugin = require( 'webpack/lib/EntryOptionPlugin' );
const path = require( 'path' );
const MemoryFS = require( 'memory-fs' );
const OverlayInputFS = require( './lib/overlay-input-fs' );

class PostCompilePlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.plugin('this-compilation', compilation => {
      let compiled = false;
      let assets;
      compilation.plugin('need-additional-seal', () => {
        return compiled;
      });
      compilation.plugin('additional-assets', callback => {
        if (compiled) {
          compiled = false;
          Object.keys(assets).forEach(filename => {
            compilation.assets[filename] = assets[filename];
          });
          callback();
          return;
        }

        const fs = new MemoryFS();
        const compiler = this.createChildCompiler(compilation, fs);
        const outputPath = compilation.compiler.outputPath;

        Object.keys(compilation.assets).forEach(filename => {
          const asset = compilation.assets[ filename ];
          const filepath = path.join(outputPath, filename);
          fs.mkdirpSync(path.dirname(filepath));
          fs.writeFileSync(filepath, asset.source());
        });

        compiler.runAsChild((err, entries, compilation) => {
          compiled = true;
          assets = compilation.assets;
          callback(err);
        });
      });
    });
  }

  createChildCompiler(compilation, fs) {
    const options = this.options;
    const compiler = compilation.compiler;
    const childCompiler = compilation.createChildCompiler('post-compile-webpack-plugin', options.output);
    const notInOutput = filename => !fs.existsSync(filename);

    childCompiler.inputFileSystem = new OverlayInputFS(fs, compiler.inputFileSystem);
    childCompiler.outputFileSystem = compiler.outputFileSystem;
    childCompiler.watchFileSystem = compiler.watchFileSystem;

    if (options.plugins) {
      options.plugins.forEach(plugin => { childCompiler.apply(plugin); });
    }

    if (options.entry) {
      childCompiler._plugins['entry-option'] = null;
      childCompiler.apply(new EntryOptionPlugin());
      childCompiler.applyPluginsBailResult('entry-option', options.context, options.entry);
    }

    childCompiler.plugin('after-compile', (compilation, callback) => {
      compilation.fileDependencies = compilation.fileDependencies.filter(notInOutput);
      compilation.contextDependencies = compilation.contextDependencies.filter(notInOutput);
      compilation.missingDependencies = compilation.missingDependencies.filter(notInOutput);
      callback();
    });

    return childCompiler;
  }
}

module.exports = PostCompilePlugin;
