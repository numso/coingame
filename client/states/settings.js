var shared = require('../shared')
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
