var shared    = require('../shared')
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
