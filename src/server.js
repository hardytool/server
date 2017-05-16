var env = require('./env')
var config = require('./config')(env)
//var credentials = require('./credentials')(config)
var http = require('http')
//var https = require('https')
var express = require('express')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('express-session')
var passport = require('passport')
var steam = require('passport-steam')
var pg = require('pg')
var sql = require('pg-sql').sql
var RedisStore = require('connect-redis')(session)
var roster = require('./routes/roster')
var user = require('./routes/roster')
var standings = require('./routes/standings')
var migrations = require('./migrations')

var app = express()
var pool = new pg.Pool(config.db)

console.dir(config, { depth: null })

migrations.migrateIfNeeded(pool, [
  {
    name: '002',
    contents: `
    CREATE TABLE IF NOT EXISTS seal.user (
      user_id uuid PRIMARY KEY,
      name text
    );`
  },
  {
    name: '001',
    contents: 'CREATE SCHEMA IF NOT EXISTS seal;'
  }
])

passport.serializeUser(function(user, done) {
  done(null, user)
})

passport.deserializeUser(function(user, done) {
  done(null, user)
})

passport.use(new steam.Strategy({
    returnURL: 'http://' + config.server.host + ':' + config.server.port + '/auth/steam/return',
    realm: 'http://' + config.server.host + ':' + config.server.port,
    apiKey: config.server.steam_api_key
  }, function(identifier, profile, done) {
    return done(undefined, { id: identifier, profile: profile })
  }
))

app.use(cookieParser(config.server.secret))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
  store: new RedisStore({
    host: config.redis.host,
    port: config.redis.port
  }),
  secret: config.server.secret,
  resave: true,
  saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/hello', function (req, res) {
  if (req.user) {
    res.send('<div>hello ' + req.user.profile.displayName
      + '!</div><div><a href="/logout">Log out</a></div>')
  } else {
    res.send('<div>hello!</div><div><a href="/auth/steam">Log in</a></div>')
  }
})

app.get('/auth/steam', passport.authenticate('steam'))
app.get('/auth/steam/return',
  passport.authenticate('steam',
    { failureRedirect: config.server.website_url + '/login' }),
  function(req, res) {
    if (!config.server.website_url) {
      res.redirect('/hello')
    } else {
      res.redirect(config.server.website_url)
    }
  })
app.get('/logout', function(req, res) {
  req.logout()
  res.redirect(config.server.website_url)
})

app.get('/roster', roster)
app.get('/user', user)
app.get('/standings', standings)

http.createServer(app).listen(config.server.port, function() {
  console.log('Listening to HTTP connections on port ' + config.server.port)
})
//https.createServer(credentials, app).listen(config.server.https_port)
