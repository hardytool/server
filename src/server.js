// Configuration
var env = require('./env')
var config = require('./config')(env)

// Node & NPM
var path = require('path')
var http = require('http')
//var https = require('https')
var express = require('express')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('express-session')
var passport = require('passport')
var passportSteam = require('passport-steam')
var pg = require('pg')
var pool = new pg.Pool(config.db)
var RedisStore = require('connect-redis')(session)
var Steam = require('steam')
var steam = new Steam.SteamClient()
var Dota2 = require('dota2')
var dota2 = new Dota2.Dota2Client(steam, true, true)
var steamUser = new Steam.SteamUser(steam)
var templates = require('./templates')(
  path.join(__dirname, 'templates'), config.templates)

// lib
var migrations = require('./lib/migrations')(pool)
var mmr = require('./lib/mmr')(dota2)
var auth = require('./lib/auth')(config, pool, mmr)
var season = require('./lib/season')(pool)
//var team = require('./lib/team')(config, pool)

// Auth routes
var openid = require('./api/openid')(config)

// Page routes
var index = require('./pages/index')(auth)
var seasons = require('./pages/seasons')(templates, season)
var teams = require('./pages/teams')

// API routes
// none currently

// Application start

console.dir(config, { depth: null })

var app = express()

passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((user, done) => {
  auth.inflateUser(user).then(user => {
    done(null, user)
  }).catch(err => {
    done(err, null)
  })
})

passport.use(new passportSteam.Strategy({
    returnURL: 'http://' +
      config.server.host +
      ':' +
      config.server.port +
      '/auth/steam/return',
    realm: 'http://' + config.server.host + ':' + config.server.port,
    apiKey: config.server.steam_api_key
  }, (identifier, profile, done) =>  {
    auth.createUser(profile, err => {
      if (err) {
        done(err, null)
      }
      done(null, { id: identifier, profile: profile })
    })
  }))

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

app.get('/auth/steam', passport.authenticate('steam'))
app.get('/auth/steam/return',
  passport.authenticate('steam', {
    failureRedirect: config.server.website_url ? config.server.website_url : '/'
  }),
  openid.steamIdReturn)
app.get('/logout', openid.logout)

app.get(index.home.route, index.home.handler)
app.get(seasons.list.route, seasons.list.handler)
app.get(seasons.create.route, seasons.create.handler)
app.get(seasons.edit.route, seasons.edit.handler)

app.post(seasons.post.route, seasons.post.handler)

migrations.migrateIfNeeded(
  migrations.getMigrations(path.join(__dirname, 'migrations')))
  .then(versions => {
  console.log(
    `RUN ${versions.filter(version => version !== false).length} MIGRATIONS`)

  steam.connect()

  steam.on('connected', () => {
    steamUser.logOn({
      account_name: config.steam.username,
      password: config.steam.password
    })
  })

  steam.on('logOnResponse', res => {
    if (res.eresult == Steam.EResult.OK) {
      dota2.launch()
      dota2.on('ready', () => {

        http.createServer(app).listen(config.server.port, () => {
          console.log('Listening to HTTP connections on port ' +
            config.server.port)
        })
        //https.createServer(credentials, app).listen(config.server.https_port)
      })
    }
  })
}).catch(err => {
  console.error(err)
})

// Application end
