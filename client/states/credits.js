var shared = require('../shared')
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
