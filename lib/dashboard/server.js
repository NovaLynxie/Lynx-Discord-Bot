const logger = require('../utils/logger');
const path = require('path');
const express = require('express');
const app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

const 
  authRouter = require('./routes/auth'),
  dashRouter = require('./routes/dash'),
  mainRouter = require('./routes/main');
// use res.render to load up an ejs view file
function dynamicRender(res, path, data = {}) {
  res.render(path, data);
};

/*
// index page
app.get('/', function(req, res) {
  res.render('index.ejs');
});

// about page
app.get('/about', function(req, res) {
  res.render('about.ejs');
});
*/
module.exports = {
  run: () => {
    app.use('/', mainRouter);
    app.use('/auth', authRouter);
    app.use('/dash', dashRouter);
    app.listen(8080);
    logger.dash('Dashboard service running!');
  }
};