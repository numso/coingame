var shared    = require('../shared')
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
