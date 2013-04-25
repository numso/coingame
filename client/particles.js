var g = require('./content');

var GRAVITY = .004;

function create(pos) {
  var parts = [];
  for (var i = 0; i < 20; ++i) {
    parts.push(makeParticle(pos));
  }
  return {
    particles: parts,
    update: function (dTime) {
      var allDead = true;
      for (var i = 0; i < this.particles.length; ++i) {
        this.particles[i].update(dTime);
        if (!this.particles[i].isDead) {
          allDead = false;
        }
      }
      return !allDead;
    },
    render: function (ctx) {
      for (var i = 0; i < this.particles.length; ++i) {
        this.particles[i].render(ctx);
      }
    }
  };
};

function makeParticle(pos) {
  return {
    x: pos.x,
    y: pos.y,
    lifeSpan: Math.random() * 200 + 300,
    isDead: false,
    dx: Math.random() - 0.5,
    dy: -Math.random(),
    update: function (dTime) {
      if (this.isDead) return;
      this.lifeSpan -= dTime;
      if (this.lifeSpan < 0) {
        this.isDead = true;
      }
      this.dy += GRAVITY * dTime;
      this.x += this.dx * dTime;
      this.y += this.dy * dTime;
    },
    render: function (ctx) {
      if (this.isDead) return;
      ctx.drawImage(g.images[5], this.x, this.y);
    }
  };
};

exports.createEmitter = create;
