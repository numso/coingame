var shared = require('./shared');

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
