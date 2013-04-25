var shared = require('./shared')
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
