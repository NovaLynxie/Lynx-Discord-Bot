const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

// require  server-side plugins
const helmet = require('helmet');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const passport = require('passport');
const DiscordStrategy = require('passport-discord-faxes').Strategy;

// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

// define routers
const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth');
const dashRouter = require('./routes/dash');
const mainRouter = require('./routes/main');
// define paths
const dashDir = path.resolve(`${process.cwd()}/lib/dashboard`);
const viewsDir = path.resolve(`${dashDir}/views/`);
const publicDir = path.resolve(`${dashDir}/public/`);
// use res.render to load up an ejs view file
function dynamicRender(res, path, data = {}) {
  res.render(path, data);
};

module.exports = {
  run: async (client, config) => {
    // check config first before proceeding with dashboard start.
    (() => {
      logger.debug('Checking dashboard configuration...');
      if (!config) throw new Error('Dashboard configuration missing!');
      if (typeof config !== 'object') throw new Error(`Invalid configuration! Expected object, got '${typeof config}'.`);
      if (!config.clientID) throw new Error('Client ID missing or undefined!');
      if (!config.oauthSecret) throw new Error('OAuth Secret missing or undefined!');
      if (!config.callbackURL) throw new Error('Callback/Redirect URL missing or undefined!');
      if (!config.sessionSecret) throw new Error('Session secret not  defined! This is now required!');
      logger.debug('Dashboard configuration OK. Continuing with startup.');
    })();
    // start initializing the dashboard.
    app.use('/public', express.static(publicDir));
    // intialize passport and session.
    passport.use(new DiscordStrategy({
      clientID: config.clientID,
      clientSecret: config.oauthSecret,
      callbackURL: config.callbackURL,
      scope: ['identify', 'guilds'],
      prompt: 'consent',
    }, (accessToken, refreshToken, profile, cb) => {
      logger.debug(JSON.stringify(profile, null, 2));
      logger.debug(accessToken, refreshToken);
      process.nextTick(() => cb(null, profile));
    }));
    passport.serializeUser((user, done) => { done(null, user) });
    passport.deserializeUser((obj, done) => { done(null, obj) });
    app.use(session({
      store: new SQLiteStore({ db: 'sessions.db', dir: './' }),
      secret: config.sessionSecret ?? process.env.SESSION_SECRET,
      // cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, //disabled temporarily
      resave: false, saveUninitialized: false, unset: 'destroy'
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: [`'self'`, 'https:'],
          scriptSrc: [
            `'self'`, 'https:', `'unsafe-inline'`, '*.jquery.com', '*.cloudflare.com', '*.bootstrapcdn.com', '*.datatables.net', '*.jsdelivr.net', '*.googleapis.com', `'nonce-themeLoader'`, `'nonce-memberModals'`,
          ],
          fontSrc: [
            `'self'`, 'https:', 'fonts.googleapis.com',
            '*.gstatic.com', 'maxcdn.bootstrapcdn.com',
          ],
          styleSrc: [
            `'self'`, 'https:', `'unsafe-inline'`, '*.bootstrapcdn.com', '*.googleapis.com',
          ],
          imgSrc: [
            `'self'`, 'https:', 'http:', 'data:', 'w3.org', 'via.placeholder.com', 'cdn.discordapp.com', 'i.giphy.com', 'media.tenor.com',
          ],
          objectSrc: [`'none'`],
          scriptSrcElem: [
            `'self'`, 'https:', `'unsafe-inline'`, `'nonce-themeLoader'`, `'nonce-memberModals'`, '*.jquery.com', '*.cloudflare.com', '*.bootstrapcdn.com', '*.datatables.net', '*.jsdelivr.net',
          ],
          scriptSrcAttr: [
            `'self'`, 'https:',
          ],
          styleSrcElem: [
            `'self'`, 'https:', '*.bootstrapcdn.com', '*.googleapis.com',
          ],
          upgradeInsecureRequests: [],
        }, reportOnly: config.reportOnly ?? false
      },
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use((req, res, next) => {
      res.locals.app = { client, config }; next();
    });
    app.use('/', mainRouter);
    app.use('/api', apiRouter);
    app.use('/auth', authRouter);
    app.use('/dash', dashRouter);
    // error handling
    /*
    app.use((err, req, res, next) => {
      // TODO: Implement error handling middleware!  
    });
    */
    // start server on port
    app.listen(8080);
    logger.dash('Dashboard service running!');
  }
};