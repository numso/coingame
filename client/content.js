var self = require('./content');

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