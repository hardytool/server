// Configuration
var env = require('./env')
var config = require('./config')(env)

// Node & NPM
var path = require('path')
var http = require('http')
var https = require('https')
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
var redirectHttps = require('redirect-https')
var templates = require('pug-tree')(
  path.join(__dirname, 'templates'), config.templates)
var pairings = require('swiss-pairing')({ maxPerRound: 2 })

// repositories
var admin = require('./repos/admin')(pool)
var division = require('./repos/division')(pool)
var migration = require('./repos/migration')(pool)
var player = require('./repos/player')(pool)
var profile = require('./repos/profile')(pool)
var season = require('./repos/season')(pool)
var series = require('./repos/series')(pool)
var steam_user = require('./repos/steam_user')(pool)
var team = require('./repos/team')(pool)
var team_player = require('./repos/team_player')(pool)
var vouch = require('./repos/vouch')(pool)

// lib
var mmr = require('./lib/mmr')(dota2)
var steamId = require('./lib/steamId')
var auth = require('./lib/auth')(admin, steam_user, profile, mmr, steamId)
var credentials = require('./lib/credentials')(config.server)

// Auth routes
var openid = require('./api/openid')(config)

// Page routes
var indexPages = require('./pages/index')(templates, admin)
var playerPages = require('./pages/players')(templates, season, division, player, steam_user)
var profilePages = require('./pages/profile')(templates, steam_user, profile, team_player, vouch, steamId)
var seasonPages = require('./pages/seasons')(templates, season)
var divisionPages = require('./pages/divisions')(templates, season, division)
var seriesPages = require('./pages/series')(templates, season, team, series, pairings)
var teamPages = require('./pages/teams')(templates, season, team)
var registrationPages = require('./pages/registration')(
  templates, season, division, steam_user, team_player, player, mmr, profile)
var rosterPages = require('./pages/roster')(templates, season, team, team_player, series)

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

var realm = 'http' + (credentials ? 's' : '') + '://' + config.server.host +
      ':' + (credentials ? config.server.https_port : config.server.port)
passport.use(new passportSteam.Strategy({
    returnURL: realm + '/auth/steam/return',
    realm: realm,
    apiKey: config.server.steam_api_key
  }, (identifier, profile, done) =>  {
    auth.createUser(profile).then(() => {
      done(null, { id: identifier, profile: profile })
    }).catch(err => {
      done(err, null)
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
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 365
  },
  secret: config.server.secret,
  resave: true,
  saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())

app.use('/assets', express.static(path.join(__dirname, 'assets')))

app.get('/auth/steam', passport.authenticate('steam'))
app.get('/auth/steam/return',
  passport.authenticate('steam', {
    failureRedirect: config.server.website_url ? config.server.website_url : '/'
  }),
  openid.steamIdReturn)
app.get('/logout', openid.logout)

app.get(indexPages.home.route, indexPages.home.handler)
app.get(indexPages.admins.route, indexPages.admins.handler)
app.get(indexPages.complaint.route, indexPages.complaint.handler)
app.get(indexPages.rules.route, indexPages.rules.handler)

app.get(seasonPages.list.route, seasonPages.list.handler)
app.get(seasonPages.create.route, seasonPages.create.handler)
app.get(seasonPages.edit.route, seasonPages.edit.handler)

app.post(seasonPages.post.route, seasonPages.post.handler)
app.post(seasonPages.remove.route, seasonPages.remove.handler)

app.get(divisionPages.list.route, divisionPages.list.handler)
app.get(divisionPages.create.route, divisionPages.create.handler)
app.get(divisionPages.edit.route, divisionPages.edit.handler)
app.get(divisionPages.nav.route, divisionPages.nav.handler)

app.post(divisionPages.post.route, divisionPages.post.handler)
app.post(divisionPages.remove.route, divisionPages.remove.handler)

app.get(teamPages.list.route, teamPages.list.handler)
app.get(teamPages.create.route, teamPages.create.handler)
app.get(teamPages.edit.route, teamPages.edit.handler)

app.post(teamPages.post.route, teamPages.post.handler)
app.post(teamPages.remove.route, teamPages.remove.handler)

app.get(seriesPages.list.route, seriesPages.list.handler)
app.get(seriesPages.create.route, seriesPages.create.handler)
app.get(seriesPages.edit.route, seriesPages.edit.handler)
app.get(seriesPages.standings.route, seriesPages.standings.handler)
app.get(seriesPages.matchups.route, seriesPages.matchups.handler)

app.post(seriesPages.post.route, seriesPages.post.handler)
app.post(seriesPages.remove.route, seriesPages.remove.handler)

app.get(playerPages.list.route, playerPages.list.handler)
app.get(playerPages.captains.route, playerPages.captains.handler)
app.get(playerPages.standins.route, playerPages.standins.handler)
app.get(playerPages.create.route, playerPages.create.handler)
app.get(playerPages.edit.route, playerPages.edit.handler)
app.get(playerPages.csv.route, playerPages.csv.handler)

app.post(playerPages.post.route, playerPages.post.handler)
app.post(playerPages.remove.route, playerPages.remove.handler)

app.get(rosterPages.list.route, rosterPages.list.handler)
app.get(rosterPages.add.route, rosterPages.add.handler)

app.post(rosterPages.post.route, rosterPages.post.handler)
app.post(rosterPages.remove.route, rosterPages.remove.handler)

app.get(profilePages.view.route, profilePages.view.handler)
app.get(profilePages.edit.route, profilePages.edit.handler)
app.get(profilePages.vouch.route, profilePages.vouch.handler)
app.get(profilePages.confirm.route, profilePages.confirm.handler)
app.get(profilePages.unvouch.route, profilePages.unvouch.handler)

app.post(profilePages.post.route, profilePages.post.handler)

app.get(registrationPages.view.route, registrationPages.view.handler)
app.get(registrationPages.shortcut.route, registrationPages.shortcut.handler)

app.post(registrationPages.post.route, registrationPages.post.handler)
app.post(registrationPages.unregister.route, registrationPages.unregister.handler)

migration.migrateIfNeeded(
  migration.getMigrations(path.join(__dirname, 'migrations')))
  .then(versions => {
    console.log(
      `RUN ${versions.filter(version => version !== false).length} MIGRATIONS`)

    if (config.steam.username && config.steam.password) {
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
        }
      })

      steam.on('error', err => {
        console.error(err)
        if (err.message === 'Disconnected') {
          steam.connect()
        }
        else {
          throw err
        }
      })
    }

    if (credentials) {
      http.createServer(redirectHttps({
        port: config.server.https_port,
        trustProxy: true
      })).listen(config.server.port, () => {
        console.log('Redirecting from HTTP to HTTPS on port ' +
          config.server.port)
      })
      https.createServer(credentials, app).listen(config.server.https_port,
        () => {
          console.log('Listening to HTTPS connections on port ' +
            config.server.https_port)
        })
    } else {
      http.createServer(app).listen(config.server.port, () => {
        console.log('Listening to HTTP connections on port ' +
          config.server.port)
      })
    }

}).catch(err => {
  console.error(err)
})

// Application end
