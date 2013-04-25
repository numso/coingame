(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json",".jade"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/client/requires/render.js",function(require,module,exports,__dirname,__filename,process,global){var render = require('browserijade');

module.exports = function (view, locals) {
  return render(view, locals);
};

// test
});

require.define("/node_modules/browserijade/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"./lib/middleware","browserify":"./lib/browserijade"}
});

require.define("/node_modules/browserijade/lib/browserijade.js",function(require,module,exports,__dirname,__filename,process,global){// Browserijade
// (c) 2011 David Ed Mellum
// Browserijade may be freely distributed under the MIT license.

jade = require('jade/lib/runtime');

// Render a jade file from an included folder in the Browserify
// bundle by a path local to the included templates folder.
var renderFile = function(path, locals) {
	locals = locals || {};
	path = path + '.jade';
	template = require(path);
	return template(locals);
}

// Render a pre-compiled Jade template in a self-executing closure.
var renderString = function(template) {
	return eval(template);
}

module.exports = renderFile;
module.exports.renderString = renderString;
});

require.define("/node_modules/browserijade/node_modules/jade/lib/runtime.js",function(require,module,exports,__dirname,__filename,process,global){
/*!
 * Jade - runtime
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Lame Array.isArray() polyfill for now.
 */

if (!Array.isArray) {
  Array.isArray = function(arr){
    return '[object Array]' == Object.prototype.toString.call(arr);
  };
}

/**
 * Lame Object.keys() polyfill for now.
 */

if (!Object.keys) {
  Object.keys = function(obj){
    var arr = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        arr.push(key);
      }
    }
    return arr;
  }
}

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = function merge(a, b) {
  var ac = a['class'];
  var bc = b['class'];

  if (ac || bc) {
    ac = ac || [];
    bc = bc || [];
    if (!Array.isArray(ac)) ac = [ac];
    if (!Array.isArray(bc)) bc = [bc];
    ac = ac.filter(nulls);
    bc = bc.filter(nulls);
    a['class'] = ac.concat(bc).join(' ');
  }

  for (var key in b) {
    if (key != 'class') {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Filter null `val`s.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function nulls(val) {
  return val != null;
}

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 * @api private
 */

exports.attrs = function attrs(obj, escaped){
  var buf = []
    , terse = obj.terse;

  delete obj.terse;
  var keys = Object.keys(obj)
    , len = keys.length;

  if (len) {
    buf.push('');
    for (var i = 0; i < len; ++i) {
      var key = keys[i]
        , val = obj[key];

      if ('boolean' == typeof val || null == val) {
        if (val) {
          terse
            ? buf.push(key)
            : buf.push(key + '="' + key + '"');
        }
      } else if (0 == key.indexOf('data') && 'string' != typeof val) {
        buf.push(key + "='" + JSON.stringify(val) + "'");
      } else if ('class' == key && Array.isArray(val)) {
        buf.push(key + '="' + exports.escape(val.join(' ')) + '"');
      } else if (escaped && escaped[key]) {
        buf.push(key + '="' + exports.escape(val) + '"');
      } else {
        buf.push(key + '="' + val + '"');
      }
    }
  }

  return buf.join(' ');
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function escape(html){
  return String(html)
    .replace(/&(?!(\w+|\#\d+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

exports.rethrow = function rethrow(err, filename, lineno){
  if (!filename) throw err;

  var context = 3
    , str = require('fs').readFileSync(filename, 'utf8')
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};

});

require.define("fs",function(require,module,exports,__dirname,__filename,process,global){// nothing to see here... no file methods for the browser

});

require.define("/client/content.js",function(require,module,exports,__dirname,__filename,process,global){var self = require('./content');

var nop = function () {};

var paths = [
  '/img/Background.png',            // 0
  '/img/Clock.png',                 // 1
  '/img/Coin-Canadian-Dollar.png',  // 2
  '/img/Coin-Roman.png',            // 3
  '/img/Coin-US-Dollary.png',       // 4
  '/img/Dollar-Sign.png',           // 5
  '/img/Piggy-Bank.png',            // 6

  '/img/ClockR.png',                // 7
  '/img/Coin-Canadian-DollarR.png', // 8
  '/img/Coin-RomanR.png',           // 9
  '/img/Coin-US-DollaryR.png',      // 10
  '/img/results.png',               // 11
  '/img/credits.png'                // 12
];

function imageLoader(finishCb, progressCb) {
  var counter = 0;

  progressCb = progressCb || nop;
  finishCb   = finishCb || nop;

  for (var i = 0; i < paths.length; ++i) {
    loadImage(paths[i], i);
  }

  function loadImage(path, num) {
    var img = new Image();

    img.onload = function () {
      ++counter;
      self.images[num] = img;
      if (counter === paths.length) {
        finishCb();
      } else {
        progressCb(counter, paths.length);
      }
    };

    img.onerror = function () {
      console.log('could not load image ' + num + ': ' + path);
      ++counter;
      self.images[num] = new Image();
      if (counter === paths.length) {
        finishCb();
      } else {
        progressCb(counter, paths.length);
      }
    };

    img.src = path;
  };
};

function drawBackground(ctx) {
  ctx.drawImage(self.images[0], 0, 0);
};

function drawMenuButton(ctx, text, x, y) {
  // draw the outer box
  ctx.fillStyle = 'rgba(250, 136, 136, .7)';
  ctx.fillRect(x - 10, y - 40, 240, 50);

  // draw the text
  ctx.font = 'bold 36px Verdana';
  ctx.fillStyle = 'black';
  ctx.fillText(text, x, y);
};

function drawTitle(ctx) {
  // draw the title box
  ctx.fillStyle = 'rgb(194, 53, 53)';
  ctx.fillRect(190, 20, 350, 60);

  // draw the title
  ctx.font = 'bold 60px Verdana';
  ctx.fillStyle = 'black';
  ctx.fillText('Coin Drop', 200, 70);
};

exports.images = [];
exports.load   = imageLoader;

exports.drawBackground = drawBackground;
exports.drawTitle      = drawTitle;
exports.drawMenuButton = drawMenuButton;
});

require.define("/client/shared.js",function(require,module,exports,__dirname,__filename,process,global){var canvas = null;

function setCanvas(cnvs) {
  canvas = cnvs;
};

function getCursorPosition(e) {
  var x, y;

  if (e.pageX != undefined && e.pageY != undefined) {
    x = e.pageX;
    y = e.pageY;
  } else {
    x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }

  x -= canvas.offsetLeft;
  y -= canvas.offsetTop;

  return { x: x, y: y };
};

var collides = function (pos, rect) {
  var left   = rect.x
    , right  = rect.x + rect.w
    , top    = rect.y
    , bottom = rect.y + rect.h
    ;

  if (right >= pos.x && left <= pos.x && bottom >= pos.y && top <= pos.y) {
    return true;
  }

  return false;
};

exports.getCursorPosition = getCursorPosition
exports.collides          = collides
exports.state             = null;
exports.setCanvas         = setCanvas;
exports.user              = {};

});

require.define("/client/sounds.js",function(require,module,exports,__dirname,__filename,process,global){var shared = require('./shared');

var menuBg
  , gameBg
  , sounds = [
    '/snd/click.mp3',           // 0
    '/snd/countdown.mp3',       // 1
    '/snd/countdown-final.mp3', // 2
    '/snd/gameover.mp3',        // 3
    '/snd/money.mp3',           // 4
    '/snd/clock.mp3',           // 5
    '/snd/bad.mp3'              // 6
  ];

function init() {
  _loadBackground();
  _loadEffects();
};

function _loadBackground() {
  menuBg = new Howl({
    urls: ['/snd/menu.mp3'],
    loop: true
  });

  gameBg = new Howl({
    urls: ['/snd/adventure.mp3'],
    loop: true
  });
};

function _loadEffects() {
  for (var i = 0; i < sounds.length; ++i) {
    sounds[i] = new Howl({
      urls: [sounds[i]]
    });
  }
};

function playBackground(play, type) {
  type = type || 'menu';
  if (play) {
    if (type === 'menu') {
      gameBg.pause();
      menuBg.play();
    } else {
      menuBg.pause();
      gameBg.play();
    }
  } else {
    gameBg.pause();
    menuBg.pause();
  }
};

function playSound(num) {
  num = num || 0;

  if (shared.user.sounds) {
    if (num < sounds.length) {
      sounds[num].play();
    }
  }
};

function stopSound(num) {
  num = num || 0;
  if (num < sounds.length) {
    sounds[num].stop();
  }
};

exports.init           = init;
exports.playSound      = playSound;
exports.stopSound      = stopSound;
exports.playBackground = playBackground;

});

require.define("/client/game.js",function(require,module,exports,__dirname,__filename,process,global){var shared = require('./shared');

var time, ctx;

function init(context) {
  ctx = context;
  time = Date.now();
  requestAnimationFrame(gameloop);
};

function gameloop() {
  var curTime = Date.now()
    , dTime   = curTime - time;
  time = curTime;
  requestAnimationFrame(gameloop);
  update(dTime);
  render(ctx);
};

function update(dTime) {
  shared.state.update(dTime);
};

function render(ctx) {
  shared.state.render(ctx);
};

exports.init = init;

});

require.define("/client/states/menu.js",function(require,module,exports,__dirname,__filename,process,global){var shared    = require('../shared')
  , sounds    = require('../sounds')
  , g         = require('../content')
  , game      = require('./game')
  , settings  = require('./settings')
  , scores    = require('./scores')
  , credits   = require('./credits')
  ;

var menus = [{ text: 'Play Game', trigger: clickedPlay }, { text: 'Settings', trigger: clickedSettings }, { text: 'HighScores', trigger: clickedScores }, { text: 'Credits', trigger: clickedCredits }, { text: 'Exit', trigger: clickedExit }];

function init() {
  $('#game').click(function (e) {
    if (shared.state.str === 'menu') {
      e.stopImmediatePropagation();
      var pos = shared.getCursorPosition(e);
      for (var i = 0; i < menus.length; ++i) {
        if (shared.collides(pos, { x: 240, y: 160 + 70 * i, w: 240, h: 50 })) {
          menus[i].trigger();
          return false;
        }
      }

      return false;
    }
  });
};

function update(dTime) {

};

function render(ctx) {
  g.drawBackground(ctx);
  g.drawTitle(ctx);

  // draw the menu text
  for (var i = 0; i < menus.length; ++i) {
    g.drawMenuButton(ctx, menus[i].text, 250, 200 + (70 * i));
  }
};

function clickedPlay() {
  sounds.playSound(0);
  if (shared.user.music) {
    sounds.playBackground(true, 'game');
  }
  game.start();
  shared.state = game;
};

function clickedScores() {
  sounds.playSound(0);
  shared.state = scores;
};

function clickedSettings() {
  sounds.playSound(0);
  shared.state = settings;
};

function clickedCredits() {
  sounds.playSound(0);
  shared.state = credits;
};

function clickedExit() {
  sounds.playSound(0);
  if (confirm("Are you sure you want to quit playing?")) {
    window.open('', '_self', '');
    window.close();
  }
  sounds.playSound(0);
};

exports.str    = 'menu';
exports.init   = init;
exports.update = update;
exports.render = render;

});

require.define("/client/states/game.js",function(require,module,exports,__dirname,__filename,process,global){var shared    = require('../shared')
  , g         = require('../content')
  , sounds    = require('../sounds')
  , results   = require('./results')
  , coins     = require('../coinmanager')
  , particles = require('../particles')
 ;

var level      = 1
  , scores     = [0, 0, 0]
  , animations = []
  , emitters   = []
  , gameAnimationRunning
  ;

function init() {
  $('#game').mousedown(function (e) {
    if (shared.state.str === 'game') {
      e.stopImmediatePropagation();
      var pos = shared.getCursorPosition(e);

      if (!gameAnimationRunning) {
        var pos = coins.checkCollisions(pos, level, scores);
        if (pos) {
          emitters.push(particles.createEmitter(pos));
        }
      }

      return false;
    }
  });
};

function update(dTime) {
  if (!gameAnimationRunning) {
    if (coins.update(dTime)) {
      finishLevel();
    }
  }

  // update animations
  var anims = [];
  for (var i = 0; i < animations.length; ++i) {
    if (animations[i].update(dTime)) {
      anims.push(animations[i]);
    }
  }
  animations = anims;

  // update particles
  var parts = [];
  for (var i = 0; i < emitters.length; ++i) {
    if (emitters[i].update(dTime)) {
      parts.push(emitters[i]);
    }
  }
  emitters = parts;
};

function render(ctx) {
  g.drawBackground(ctx);

  // draw animations
  for (var i = 0; i < animations.length; ++i) {
    animations[i].render(ctx);
  }

  // draw coins
  coins.render(ctx);

  // draw particles
  for (var i = 0; i < emitters.length; ++i) {
    emitters[i].render(ctx);
  }

  // draw piggy bank
  ctx.fillStyle = 'yellow';
  ctx.font = 'bold 30px Verdana';
  ctx.fillText('Level ' + level, 640, 30);

  // draw piggy bank
  ctx.drawImage(g.images[6], 640, 40);
  ctx.font = 'bold 45px Verdana';
  ctx.fillText(scores[level - 1], 640, 170);

  for (var i = 0; i < level - 1; ++i) {
    ctx.font = 'bold 20px Verdana';
    ctx.fillText('lvl ' + (i+1) + ': ' + scores[i], 640, 225 + 40 * i);
  }
};

function start(scrs, lvl) {
  level = lvl || 1;
  scores = scrs || [0, 0, 0];

  coins.prepare(level);
  gameAnimationRunning = true;
  animations.push(countdown());
};

function finishLevel() {
  if (scores[level - 1] >= 100 && level < 3) {
    start(scores, level + 1);
  } else {
    gameAnimationRunning = true;
    animations.push(gameover());
  }
};

function finishGame() {
  results.setScores(scores);
  shared.state = results;
};

exports.str    = 'game';
exports.init   = init;
exports.update = update;
exports.render = render;
exports.start  = start;

var countdown = function () {
  var num   = 3
    , timer = 0
    ;
  sounds.playSound(1);

  return {
    update: function (dTime) {
      timer += dTime;
      if (timer >= 800) {
        timer = 0;
        num--;
        if (num === -1) {
          gameAnimationRunning = false;
          return false;
        } else if (num === 0) {
          sounds.playSound(2);
        } else {
          sounds.playSound(1);
        }
      }
      return true;
    },
    render: function (ctx) {
      ctx.font = 'bold 100px Verdana';
      ctx.fillStyle = 'yellow';
      if (num > 0) {
        ctx.fillText(num, 300, 300);
      } else {
        ctx.fillText('start', 200, 300);
      }
    }
  };
};

var gameover = function () {
  var timer = 0;
  sounds.playSound(3)

  return {
    update: function (dTime) {
      timer += dTime;
      if (timer >= 1500) {
        gameAnimationRunning = false;
        finishGame();
        return false;
      }
      return true;
    },
    render: function (ctx) {
      ctx.font = 'bold 100px Verdana';
      ctx.fillStyle = 'yellow';
      ctx.fillText('Game Over', 100, 300);
    }
  };
};

});

require.define("/client/states/results.js",function(require,module,exports,__dirname,__filename,process,global){var shared    = require('../shared')
  , g         = require('../content')
  , sounds    = require('../sounds')
  , hiscores  = require('./scores')
  , particles = require('../particles')
  ;

var scores, total, gotHighScore, newScoreNum;

var fireWorks = {
  timer: 0,
  count: 0,
  bombs: []
};

function init() {
  $('#game').click(function (e) {
    if (shared.state.str === 'results') {
      e.stopImmediatePropagation();
      var pos = shared.getCursorPosition(e);

      if (shared.collides(pos, { x: 240, y: 440, w: 240, h: 50 })) {
        sounds.playSound(0);
        if (shared.user.music) {
          sounds.playBackground(true, 'menu');
        }
        shared.state = hiscores;
      }

      return false;
    }
  });
};

function update(dTime) {
  if (dTime > 30) dTime = 30;

  if (newScoreNum != -1) {
    grabScore(newScoreNum);
    newScoreNum = -1;
  }

  if (gotHighScore) {
    fireWorks.timer += dTime;
    if (fireWorks.timer >= 100) {
      fireWorks.count++;
      fireWorks.bombs.push(fireWork());
    }
  }

  var newBombs = [];
  for (var i = 0; i < fireWorks.bombs.length; ++i) {
    if (fireWorks.bombs[i].update(dTime)) {
      newBombs.push(fireWorks.bombs[i]);
    }
  }
  fireWorks.bombs = newBombs;
};

function fireWork() {
  var emitter = particles.createEmitter({
    x: Math.random() * 775,
    y: Math.random() * 530
  });

  return {
    update: function (dTime) {
      return emitter.update(dTime);
    },
    render: function (ctx) {
      emitter.render(ctx);
    }
  };
}

function render(ctx) {
  g.drawBackground(ctx);

  for (var i = 0; i < fireWorks.bombs.length; ++i) {
    fireWorks.bombs[i].render(ctx);
  }

  ctx.drawImage(g.images[11], 115, 50);

  ctx.fillStyle = 'black';
  ctx.font = 'bold 50px Verdana';

  if (gotHighScore) {
    ctx.fillText('High Score!!', 230, 100);
  } else {
    ctx.fillText('Thanks For Playing!', 120, 100);
  }

  ctx.fillStyle = 'yellow';
  ctx.font = 'bold 35px Verdana';
  ctx.fillText('Total Score: ' + total, 200, 200);

  ctx.font = 'bold 25px Verdana';
  for (var i = 0; i < scores.length; ++i) {
    ctx.fillText('Level ' + (i + 1) + ' Score: ' + scores[i], 200, 290 + i * 50);
  }

  // draw continue
    g.drawMenuButton(ctx, 'Continue', 250, 480);
};

function grabScore(place) {
  var name = prompt('Enter Your Name!!');
  if (name === null || name === '') {
    return;
  }

  shared.hiScores.splice(place, 0, { name: name, score: total, levels: scores });
  shared.hiScores.length = 5;
  $.post('/updateScores', { scores: shared.hiScores });
};

exports.str    = 'results';
exports.init   = init;
exports.update = update;
exports.render = render;

exports.setScores = function (scrs) {
  fireWorks.timer = 0;
  fireWorks.count = 0;
  fireWorks.bombs = [];

  newScoreNum = -1;
  gotHighScore = false;
  scores = scrs;
  total = 0;
  for (var i = 0; i < scores.length; ++i) {
    total += scores[i];
  }

  for (var i = 0; i < shared.hiScores.length; ++i) {
    if (total > shared.hiScores[i].score) {
      gotHighScore = true;
      newScoreNum = i;
      return;
    }
  }
};

});

require.define("/client/states/scores.js",function(require,module,exports,__dirname,__filename,process,global){var shared = require('../shared')
  , g      = require('../content')
  , sounds = require('../sounds')
  , menu   = require('./menu')
  ;

function init() {
  $('#game').click(function (e) {
    if (shared.state.str === 'scores') {
      e.stopImmediatePropagation();
      var pos = shared.getCursorPosition(e);

      if (shared.collides(pos, { x: 240, y: 460, w: 240, h: 50 })) {
        sounds.playSound(0);
        shared.state = menu;
      }

      return false;
    }
  });
};

function update(dTime) {

};

function render(ctx) {
  // draw background
  g.drawBackground(ctx);
  ctx.drawImage(g.images[11], 115, 50);

  // draw title
  ctx.fillStyle = 'black';
  ctx.font = 'bold 50px Verdana';
  ctx.fillText('High Scores', 230, 100);

  ctx.fillStyle = 'yellow';
  ctx.font = 'bold 35px Verdana';
  ctx.fillText('Name', 150, 140);
  ctx.fillText('Score', 450, 140);
  for (var i = 0; i < shared.hiScores.length; ++i) {
    ctx.font = 'bold 25px Verdana';
    ctx.fillText(shared.hiScores[i].name.substr(0, 18), 150, 190 + i * 40);
    ctx.fillText(shared.hiScores[i].score, 450, 190 + i * 40);
    ctx.font = 'bold 15px Verdana';
    ctx.fillText('(' + shared.hiScores[i].levels.join(', ') + ')', 530, 190 + i * 40);
  }
  // draw back button
  g.drawMenuButton(ctx, 'Back', 250, 500);
};

exports.str    = 'scores';
exports.init   = init;
exports.update = update;
exports.render = render;

});

require.define("/client/particles.js",function(require,module,exports,__dirname,__filename,process,global){var g = require('./content');

var GRAVITY = .004;

function create(pos) {
  var parts = [];
  for (var i = 0; i < 20; ++i) {
    parts.push(makeParticle(pos));
  }
  return {
    particles: parts,
    update: function (dTime) {
      var allDead = true;
      for (var i = 0; i < this.particles.length; ++i) {
        this.particles[i].update(dTime);
        if (!this.particles[i].isDead) {
          allDead = false;
        }
      }
      return !allDead;
    },
    render: function (ctx) {
      for (var i = 0; i < this.particles.length; ++i) {
        this.particles[i].render(ctx);
      }
    }
  };
};

function makeParticle(pos) {
  return {
    x: pos.x,
    y: pos.y,
    lifeSpan: Math.random() * 200 + 300,
    isDead: false,
    dx: Math.random() - 0.5,
    dy: -Math.random(),
    update: function (dTime) {
      if (this.isDead) return;
      this.lifeSpan -= dTime;
      if (this.lifeSpan < 0) {
        this.isDead = true;
      }
      this.dy += GRAVITY * dTime;
      this.x += this.dx * dTime;
      this.y += this.dy * dTime;
    },
    render: function (ctx) {
      if (this.isDead) return;
      ctx.drawImage(g.images[5], this.x, this.y);
    }
  };
};

exports.createEmitter = create;

});

require.define("/client/coinmanager.js",function(require,module,exports,__dirname,__filename,process,global){var shared = require('./shared')
  , g      = require('./content')
  , sounds = require('./sounds')
  ;

var coinStats = [
  { w: 75,  h: 75,  num: 4 }, // american dollar
  { w: 40,  h: 40,  num: 3 }, // roman coin
  { w: 150, h: 150, num: 2 }, // canadian coin
  { w: 40,  h: 40,  num: 1 }  // clock
];

var levelStats = [
  'hi',
  { total: 22, totals: [10, 3, 8, 1], extra: 5},
  { total: 32, totals: [15, 4, 12, 1], extra: 8},
  { total: 41, totals: [20, 5, 15, 1], extra: 10}
];

var coins, dropper;

function prepCoins(level) {
  var myTotals = [0, 0, 0, 0];

  coins = [];
  for (var i = 0; i < levelStats[level].total; ++i) {
    var c = 3;
    if (i !== Math.floor(levelStats[level].total / 2)) {
      var c = Math.floor(Math.random() * 3);
    }
    myTotals[c]++;
    if (myTotals[c] > levelStats[level].totals[c]) {
      --i;
    } else {
      addCoin(c, level);
    }
  }
};

function addCoin(c, level) {
  c = coinStats[c];
  var xPos = Math.random() * (625 - c.w);

  coins.push({
    update: function (dTime) {
      if (!this.inPlay) return;
      this.y += dTime * this.speed;
      if (this.y > 530) {
        this.dead = true;
        this.inPlay = false;
      }

      this.newX += this.spinSpeed;
      this.newW -= this.spinSpeed * 2;

      if (this.newX < this.x || this.newW > this.w) {
        this.newX = this.x;
        this.newW = this.w;
        this.spinSpeed *= -1;
      }

      if (this.newX > this.x + this.w / 2 || this.newW < 0) {
        this.newX = this.x + this.w / 2;
        this.newW = 0;
        this.spinSpeed *= -1;
        this.flipped = !this.flipped;
      }
    },
    render: function (ctx) {
      if (this.inPlay && !this.dead) {
        var offset = this.flipped ? 6 : 0;
        ctx.drawImage(g.images[this.texture + offset], this.newX, this.y, this.newW, this.h);
      }
    },
    dead: false,
    inPlay: false,
    x: xPos,
    y: -c.h,
    w: c.w,
    h: c.h,
    texture: c.num,
    spinSpeed: Math.random() * 4,
    newX: xPos,
    newW: c.w,
    flipped: false,
    speed: Math.random() / 5 + level * 0.1
  });
};

function dropCoins() {
  var iterator   = 0
    , totalTime  = 0
    , nextDrop   = Math.random() * 400 + 200
    ;

  return {
    update: function (dTime) {
      totalTime += dTime;
      if (totalTime >= nextDrop) {
        totalTime = 0;
        nextDrop = Math.random() * 400 + 200;
        if (iterator < coins.length) {
          coins[iterator].inPlay = true;
          iterator++;
        }
      }
    }
  };
};


exports.prepare = function (level) {
  prepCoins(level);
  dropper = dropCoins();
};

exports.render = function (ctx) {
  for (var i = 0; i < coins.length; ++i) {
    coins[i].render(ctx);
  }
};

exports.update = function (dTime) {
  dropper.update(dTime);

  // update coins
  var isFinished = true;
  for (var i = 0; i < coins.length; ++i) {
    coins[i].update(dTime);
    if (!coins[i].dead) {
      isFinished = false;
    }
  }

  return isFinished;
};

exports.checkCollisions = function (pos, level, scores) {
  for (var i = coins.length - 1; i >= 0; --i) {
    if (collides(pos, { x: coins[i].newX, y: coins[i].y, w: coins[i].newW, h: coins[i].h })) {
      if (coins[i].inPlay) {
        var particlesPos = { x: coins[i].newX + coins[i].newW / 2, y: coins[i].y + coins[i].h / 2};
        coins[i].dead = true;
        coins[i].inPlay = false;
        if (coins[i].texture === 1) {
          sounds.playSound(5);
          for (var j = 0; j < levelStats[level].extra; ++j) {
            addCoin(0, level);
          }
        } else if (coins[i].texture === 2) {
          scores[level - 1] = 0;
          sounds.playSound(6);
        } else if (coins[i].texture === 3) {
          scores[level - 1] += 50;
          sounds.playSound(4);
          return particlesPos;
        } else {
          scores[level - 1] += 10;
          sounds.playSound(4);
          return particlesPos;
        }
        return;
      }
    }
  }
};

function collides(pos, coin) {
  var cx = coin.x + coin.w / 2;
  var cy = coin.y + coin.h / 2;
  var test = Math.pow(pos.x - cx, 2) / Math.pow(coin.w / 2, 2) + Math.pow(pos.y - cy, 2) / Math.pow(coin.h / 2, 2);
  if (test <= 1) {
    return true;
  }
  return false;
};

});

require.define("/client/states/settings.js",function(require,module,exports,__dirname,__filename,process,global){var shared = require('../shared')
  , g      = require('../content')
  , sounds = require('../sounds')
  , menu   = require('./menu')
  ;

function init() {
  $('#game').click(function (e) {
    if (shared.state.str === 'settings') {
      e.stopImmediatePropagation();
      var pos = shared.getCursorPosition(e);

      // hit music button
      if (shared.collides(pos, { x: 240, y: 160, w: 240, h: 50 })) {
        sounds.playSound(0);
        shared.user.music = !shared.user.music;

        if (shared.user.music) {
          sounds.playBackground(true, 'menu');
        } else {
          sounds.playBackground(false);
        }
        $.post('/updateUser', { music: shared.user.music });
      }

      // hit sounds button
      if (shared.collides(pos, { x: 240, y: 230, w: 240, h: 50 })) {
        shared.user.sounds = !shared.user.sounds;
        sounds.playSound(0);
        $.post('/updateUser', { sounds: shared.user.sounds });
      }

      // hit back button
      if (shared.collides(pos, { x: 240, y: 410, w: 240, h: 50 })) {
        sounds.playSound(0);
        shared.state = menu;
      }

      return false;
    }
  });
};

function update(dTime) {

};

function render(ctx) {
  g.drawBackground(ctx);
  g.drawTitle(ctx);

  var text = shared.user.music ? 'Music' : 'No Music';
  g.drawMenuButton(ctx, text, 250, 200);

  text = shared.user.sounds ? 'Sounds' : 'No Sounds';
  g.drawMenuButton(ctx, text, 250, 270);

  g.drawMenuButton(ctx, 'Back', 250, 450);
};

exports.str    = 'settings';
exports.init   = init;
exports.update = update;
exports.render = render;

});

require.define("/client/states/credits.js",function(require,module,exports,__dirname,__filename,process,global){var shared = require('../shared')
  , g      = require('../content')
  , sounds = require('../sounds')
  , menu   = require('./menu')
  ;

function init() {
  $('#game').click(function (e) {
    if (shared.state.str === 'credits') {
      e.stopImmediatePropagation();
      var pos = shared.getCursorPosition(e);

      if (shared.collides(pos, { x: 240, y: 460, w: 240, h: 50 })) {
        sounds.playSound(0);
        shared.state = menu;
        return false;
      }

      if (shared.collides(pos, { x: 400, y: 100, w: 285, h: 60 })) {
        sounds.playSound(0);
        openLink('http://www.dallinosmun.com');
        return false;
      }

      if (shared.collides(pos, { x: 380, y: 290, w: 315, h: 50 })) {
        sounds.playSound(0);
        openLink('http://www.mattmcfarland.com/');
        return false;
      }

      return false;
    }
  });
};

function openLink(link) {
  window.open(link, '_blank');
  window.focus();
};

function update(dTime) {

};

function render(ctx) {
  g.drawBackground(ctx);
  ctx.drawImage(g.images[12], 0, 0);
  g.drawMenuButton(ctx, 'Back', 250, 500);
};

exports.str    = 'credits';
exports.init   = init;
exports.update = update;
exports.render = render;

});

require.define("/client/main.js",function(require,module,exports,__dirname,__filename,process,global){window.require = require;

var content = require('./content')
  , shared  = require('./shared')
  , sounds  = require('./sounds')
  , game    = require('./game')
  ;

$.get('/getScores', function (data) {
  shared.hiScores = JSON.parse(data);
});

shared.user = JSON.parse($('.user').text());

var states = [
  require('./states/menu'),
  require('./states/game'),
  require('./states/settings'),
  require('./states/scores'),
  require('./states/results'),
  require('./states/credits')
];

function createGame() {
  var canvas = document.getElementById('game')
    , ctx    = canvas.getContext('2d');

  window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (cb) { window.setTimeout(cb, 1000 / 60); };

  sounds.init();
  shared.setCanvas(canvas);

  for (var i = 0; i < states.length; ++i) {
    states[i].init();
  }

  content.load(function () {
    $('.loading-box').remove();
    shared.state = states[0];
    if (shared.user.music) {
      sounds.playBackground(true, 'menu');
    }
    game.init(ctx);
  }, function (num, total) {
    $('.loading').css('width', num / total * 100 + "%");
  });
};

createGame();

});
require("/client/main.js");
})();
