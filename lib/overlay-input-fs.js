'use strict';

module.exports = OverlayInputFS;

['stat', 'readdir', 'readFile', 'readlink'].forEach(fn => {
  OverlayInputFS.prototype[fn] = tryAsync(fn);
});

['statSync', 'readdirSync', 'readFileSync', 'readlinkSync'].forEach(fn => {
  OverlayInputFS.prototype[fn] = trySync(fn);
});

function OverlayInputFS() {
  this.layers = Array.prototype.slice.apply(arguments);
}

function trySync(fn) {
  return function() {
    let err;
    for (let i = 0; i < this.layers.length; i++) {
      try {
        return this.layers[i][fn].apply(this.layers[i], arguments);
      }
      catch (e) {
        err = e;
      }
    }
    throw err;
  };
}

function tryAsync(fn) {
  return function () {
    const args = Array.prototype.slice.apply(arguments);
    const callback = args.pop();
    const layers = this.layers;
    let i = 0;

    return tryNext();

    function tryNext() {
      const layer = layers[i++];
      const next = i === layers.length ? callback : function (err) {
        return err ? tryNext() : callback.apply(this, arguments);
      };

      try {
        return layer[fn].apply(layer, args.concat([next]));
      }
      catch (e) {
        next(e);
      }
    }
  };
}

