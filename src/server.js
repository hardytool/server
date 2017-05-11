var env = require('./env')
var config = require('./config')(env)
//var credentials = require('./credentials')(config)
var http = require('http')
//var https = require('https')
var express = require('express')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('express-session')
var static = require('serve-static')
var passport = require('passport')
var steam = require('passport-steam')
var pg = require('pg')

var app = express()
var pool = new pg.Pool(config.db)

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

app.use(static('public'))
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/', function (req, res) {
  if (req.user) {
    res.send('<div>hello ' + req.user.profile.displayName
      + '!</div><div><a href="/logout">Log out</a></div>')
  } else {
    res.send('<div>hello!</div><div><a href="/auth/steam">Log in</a></div>')
  }
})

app.get('/auth/steam', passport.authenticate('steam'))
app.get('/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/')
  })
app.get('/logout', function(req, res) {
  req.logout()
  res.redirect('/')
})

http.createServer(app).listen(config.server.port, function() {
  console.log('Listening to HTTP connections on port ' + config.server.port)
})
//https.createServer(credentials, app).listen(config.server.https_port)
