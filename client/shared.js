var canvas = null;

function setCanvas(cnvs) {
  canvas = cnvs;
};

function getCursorPosition(e) {
  var x, y;

  if (e.pageX != undefined && e.pageY != undefined) {
    x = e.pageX;
    y = e.pageY;
  } else {
    x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }

  x -= canvas.offsetLeft;
  y -= canvas.offsetTop;

  return { x: x, y: y };
};

var collides = function (pos, rect) {
  var left   = rect.x
    , right  = rect.x + rect.w
    , top    = rect.y
    , bottom = rect.y + rect.h
    ;

  if (right >= pos.x && left <= pos.x && bottom >= pos.y && top <= pos.y) {
    return true;
  }

  return false;
};

exports.getCursorPosition = getCursorPosition
exports.collides          = collides
exports.state             = null;
exports.setCanvas         = setCanvas;
exports.user              = {};
