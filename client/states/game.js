var shared    = require('../shared')
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
