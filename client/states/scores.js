var shared = require('../shared')
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
