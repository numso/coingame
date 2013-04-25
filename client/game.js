var shared = require('./shared');

var time, ctx;

function init(context) {
  ctx = context;
  time = Date.now();
  requestAnimationFrame(gameloop);
};

function gameloop() {
  var curTime = Date.now()
    , dTime   = curTime - time;
  time = curTime;
  requestAnimationFrame(gameloop);
  update(dTime);
  render(ctx);
};

function update(dTime) {
  shared.state.update(dTime);
};

function render(ctx) {
  shared.state.render(ctx);
};

exports.init = init;
