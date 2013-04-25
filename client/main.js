window.require = require;

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
