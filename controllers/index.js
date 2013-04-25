var fs = require('fs');

exports.init = function (app) {

  app.get('/',
    app.middleware.render('index/index')
  );

  app.post('/updateUser',
    updateUser
  );

  app.get('/getScores',
    getScores
  );

  app.post('/updateScores',
    updateScores
  );

};

function updateUser(req, res, next) {
  var newUser = req.body;

  for (var key in newUser) {
    if (newUser[key] === 'false') {
      newUser[key] = false;
    }
    if (newUser[key] === 'true') {
      newUser[key] = true;
    }
    req.session.user[key] = newUser[key];
  }

  res.send('ok');
};

function getScores(req, res, next) {
  var scores = fs.readFileSync('models/scores.json');
  res.send(scores);
};

function updateScores(req, res, next) {
  var newScores = JSON.stringify(req.body.scores);
  fs.writeFileSync('models/scores.json', newScores);
  res.send('ok');
};
