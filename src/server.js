// Configuration
var env = require('./env')
var config = require('./config')(env)

// Node & NPM
var path = require('path')
var http = require('http')
var https = require('https')
var express = require('express')
var helmet = require('helmet')
var csurf = require('csurf')
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
var fs = require('fs')
var request =  require('request');

// repositories
var admin = require('./repos/admin')(pool)
var admin_group = require('./repos/admin_group')(pool)
var division = require('./repos/division')(pool)
var migration = require('./repos/migration')(pool)
var player = require('./repos/player')(pool)
var player_role = require('./repos/player_role')(pool)
var profile = require('./repos/profile')(pool)
var role = require('./repos/role')(pool)
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
var wait = require('./lib/wait')
var timeout = require('./lib/timeout')

// Auth routes
var openid = require('./api/openid')(config)

// Page routes
var indexPages = require('./pages/index')(templates, path.join(__dirname, 'assets', 'rules.md'), path.join(__dirname, 'assets', 'inhouserules.md'))
var playerPages = require('./pages/players')(templates, season, division, player, player_role, role, steam_user)
var profilePages = require('./pages/profile')(templates, steam_user, profile, season, team_player, vouch, steamId, player)
var seasonPages = require('./pages/seasons')(templates, season)
var divisionPages = require('./pages/divisions')(templates, season, division, admin)
var seriesPages = require('./pages/series')(templates, season, team, series, pairings, division)
var teamPages = require('./pages/teams')(templates, season, division, team, team_player)
var registrationPages = require('./pages/registration')(
  templates, season, division, steam_user, team_player, player, role, player_role, mmr, profile)
var rosterPages = require('./pages/roster')(templates, season, division, team, team_player, series)
var rolePages = require('./pages/roles')(templates, role)
var adminPages = require('./pages/admins')(templates, admin, division, admin_group)
var adminGroupPages = require('./pages/admin_groups')(templates, admin_group)

// API routes
// none currently

// Application start

console.dir(config, { depth: null })

var app = express()

var csrfMiddleware = csurf({
  cookie: true
})

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

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser(config.server.secret))
app.use(helmet({
  frameguard: {
    action: 'deny'
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "use.fontawesome.com", "unpkg.com", "cdn.joinhoney.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "use.fontawesome.com", "unpkg.com", "cdn.joinhoney.com", "fonts.googleapis.com"],
      imgSrc: ["'self'", "cdn.discordapp.com", "steamcdn-a.akamaihd.net", "i.imgur.com"],
      fontSrc: ["'self'", "cdn.joinhoney.com"]
    }
  }
}))
app.use(csrfMiddleware)
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
app.get(indexPages.complaint.route, indexPages.complaint.handler)
app.get(indexPages.rules.route, indexPages.rules.handler)
app.get(indexPages.irules.route, indexPages.irules.handler)

app.get(seasonPages.list.route, seasonPages.list.handler)
app.get(seasonPages.create.route, seasonPages.create.handler)
app.get(seasonPages.edit.route, seasonPages.edit.handler)

app.post(seasonPages.post.route, seasonPages.post.handler)
app.post(seasonPages.remove.route, seasonPages.remove.handler)

app.get(divisionPages.list.route, divisionPages.list.handler)
app.get(divisionPages.create.route, divisionPages.create.handler)
app.get(divisionPages.edit.route, divisionPages.edit.handler)
app.get(divisionPages.nav.route, divisionPages.nav.handler)
app.get(divisionPages.all_seasons.route, divisionPages.all_seasons.handler)

app.post(divisionPages.post.route, divisionPages.post.handler)
app.post(divisionPages.remove.route, divisionPages.remove.handler)

app.get(teamPages.list.route, teamPages.list.handler)
app.get(teamPages.create.route, teamPages.create.handler)
app.get(teamPages.edit.route, teamPages.edit.handler)
app.get(teamPages.json.route, teamPages.json.handler)

app.post(teamPages.post.route, teamPages.post.handler)
app.post(teamPages.remove.route, teamPages.remove.handler)

app.get(seriesPages.list.route, seriesPages.list.handler)
app.get(seriesPages.create.route, seriesPages.create.handler)
app.get(seriesPages.edit.route, seriesPages.edit.handler)
app.get(seriesPages.standings.route, seriesPages.standings.handler)
app.get(seriesPages.matchups.route, seriesPages.matchups.handler)
app.get(seriesPages.importSeries.route, seriesPages.importSeries.handler)
app.get(seriesPages.editRound.route, seriesPages.editRound.handler)

app.post(seriesPages.post.route, seriesPages.post.handler)
app.post(seriesPages.remove.route, seriesPages.remove.handler)
app.post(seriesPages.saveRound.route, seriesPages.saveRound.handler)

app.get(playerPages.list.route, playerPages.list.handler)
app.get(playerPages.captains.route, playerPages.captains.handler)
app.get(playerPages.standins.route, playerPages.standins.handler)
app.get(playerPages.create.route, playerPages.create.handler)
app.get(playerPages.edit.route, playerPages.edit.handler)
app.get(playerPages.csv.route, playerPages.csv.handler)
app.get(playerPages.activityCheck.route, playerPages.activityCheck.handler)
app.get(playerPages.activityCheckAdmin.route, playerPages.activityCheckAdmin.handler)
app.get(playerPages.json.route, playerPages.json.handler)

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
app.get(registrationPages.directory.route, registrationPages.directory.handler)
app.get(registrationPages.directoryShortcut.route, registrationPages.directoryShortcut.handler)

app.post(registrationPages.post.route, registrationPages.post.handler)
app.post(registrationPages.unregister.route, registrationPages.unregister.handler)

app.get(rolePages.list.route, rolePages.list.handler)
app.get(rolePages.create.route, rolePages.create.handler)
app.get(rolePages.edit.route, rolePages.edit.handler)

app.post(rolePages.post.route, rolePages.post.handler)
app.post(rolePages.remove.route, rolePages.remove.handler)

app.get(adminPages.list.route, adminPages.list.handler)
app.get(adminPages.create.route, adminPages.create.handler)
app.get(adminPages.edit.route, adminPages.edit.handler)

app.post(adminPages.post.route, adminPages.post.handler)
app.post(adminPages.remove.route, adminPages.remove.handler)

app.get(adminGroupPages.list.route, adminGroupPages.list.handler)
app.get(adminGroupPages.create.route, adminGroupPages.create.handler)
app.get(adminGroupPages.edit.route, adminGroupPages.edit.handler)

app.post(adminGroupPages.post.route, adminGroupPages.post.handler)
app.post(adminGroupPages.remove.route, adminGroupPages.remove.handler)

//Pull the list of Steam servers if it exists
if (fs.existsSync(path.join(__dirname, 'assets', 'servers.js'))) {
  Steam.servers = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets', 'servers.js')))
}

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

      steam.on('servers', servers => {
        fs.writeFile(path.join(__dirname, 'assets', 'servers.js'), JSON.stringify(servers));
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

    var repeat = () => {
      steam_user.getSteamUsers().then(users => {
        users.forEach((user, index) => {
          setTimeout(() => {
            return wait(1000, () => mmr.isAvailable()).then(() => {
              return mmr.getMMR(user.steam_id).then(mmr => {
                user.rank = mmr && mmr.rank ? mmr.rank : user.rank
                return steam_user.saveSteamUser(user)
              })
            })
          }, 1000 * (index + 1))
        })
      }).catch(err => {
        console.error(err)
        console.log('Error recovered - continuing')
      })
      setTimeout(repeat, 60*60*1000)
    }
    repeat()

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
