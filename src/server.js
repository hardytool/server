// Configuration
const env = require('./env')
const config = require('./config')(env)

// Node & NPM
const path = require('path')
const http = require('http')
const https = require('https')
const express = require('express')
const fs = require('fs')
const csurf = require('csurf')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const passport = require('passport')
const passportSteam = require('passport-steam')
const pg = require('pg')
const pool = new pg.Pool(config.db)
const redis = require('redis')
const RedisStore = require('connect-redis')(session)
const Steam = require('steam')
const steam = new Steam.SteamClient()
const steamUser = new Steam.SteamUser(steam)
const Dota2 = require('dota2')
const dota2 = new Dota2.Dota2Client(steam, true, true)
const redirectHttps = require('redirect-https')
const templates = require('pug-tree')(
  path.join(__dirname, 'templates'), config.templates)
const pairings = require('swiss-pairing')({ maxPerRound: 2 })

// repositories
const admin = require('./repos/admin')(pool)
const admin_group = require('./repos/admin_group')(pool)
const banned_player = require('./repos/banned_player')(pool)
const division = require('./repos/division')(pool)
const ip_address = require('./repos/ip_address')(pool)
const migration = require('./repos/migration')(pool)
const player = require('./repos/player')(pool)
const player_role = require('./repos/player_role')(pool)
const profile = require('./repos/profile')(pool)
const role = require('./repos/role')(pool)
const season = require('./repos/season')(pool)
const series = require('./repos/series')(pool)
const steam_user = require('./repos/steam_user')(pool)
const team = require('./repos/team')(pool)
const team_player = require('./repos/team_player')(pool)
const vouch = require('./repos/vouch')(pool)

// lib
const mmr = require('./lib/mmr')(dota2)
const steamId = require('./lib/steamId')
const auth = require('./lib/auth')(admin, steam_user, profile, mmr, steamId)
const credentials = require('./lib/credentials')(config.server)

// Auth routes
const openid = require('./api/openid')(config)

// Page routes
const adminPages = require('./pages/admins')(templates,
  admin,
  division,
  admin_group)
const adminGroupPages = require('./pages/admin_groups')(templates, admin_group)
const bannedPlayerPages = require('./pages/banned_players')(templates, banned_player)
const divisionPages = require('./pages/divisions')(templates,
  season,
  division,
  admin)
const indexPages = require('./pages/index')(templates,
  path.join(__dirname, 'assets', 'rules.md'),
  path.join(__dirname, 'assets', 'inhouserules.md'))
const ipPages = require('./pages/ips')(templates, steam_user, ip_address, steamId)
const playerPages = require('./pages/players')(templates,
  season,
  division,
  player,
  player_role,
  role,
  steam_user)
const playoffSeriesPages = require('./pages/playoffSeries')(templates,
  season,
  team,
  series,
  pairings)
const profilePages = require('./pages/profile')(templates,
  steam_user,
  profile,
  season,
  team_player,
  vouch,
  steamId,
  player)
const registrationPages = require('./pages/registration')(templates,
  season,
  division,
  steam_user,
  team_player,
  player,
  role,
  player_role,
  mmr,
  profile)
const rosterPages = require('./pages/roster')(templates,
  season,
  division,
  team,
  team_player,
  series)
const rolePages = require('./pages/roles')(templates, role)
const seasonPages = require('./pages/seasons')(templates, season, division)
const seriesPages = require('./pages/series')(templates,
  season,
  team,
  series,
  pairings,
  division)
const teamPages = require('./pages/teams')(templates,
  season,
  division,
  team,
  team_player,
  player)

// API routes
// none currently

// Application start

console.dir(config, { depth: null })

const app = express()

const csrfMiddleware = csurf({
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

const realm = 'http' + (credentials ? 's' : '') + '://' + config.server.host +
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
app.use(csrfMiddleware)
app.use(session({
  store: new RedisStore({
    client: redis.createClient({
      host: config.redis.host,
      port: config.redis.port
    })
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
app.use((req, _, next) => {
  if (req.user) {
    ip_address.saveIPAddress(req.connection.remoteAddress, req.user.steamId).catch(err => {
      console.error(err)
    })
  }
  next()
})
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
app.get(indexPages.playoffs.route, indexPages.playoffs.handler)

app.get(seasonPages.list.route, seasonPages.list.handler)
app.get(seasonPages.create.route, seasonPages.create.handler)
app.get(seasonPages.edit.route, seasonPages.edit.handler)
app.get(seasonPages.start.route, seasonPages.start.handler)

app.post(seasonPages.post.route, seasonPages.post.handler)
app.post(seasonPages.remove.route, seasonPages.remove.handler)

app.get(divisionPages.list.route, divisionPages.list.handler)
app.get(divisionPages.listAll.route, divisionPages.listAll.handler)
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
app.get(teamPages.importTeams.route, teamPages.importTeams.handler)

app.post(teamPages.post.route, teamPages.post.handler)
app.post(teamPages.remove.route, teamPages.remove.handler)

app.get(seriesPages.list.route, seriesPages.list.handler)
app.get(seriesPages.create.route, seriesPages.create.handler)
app.get(seriesPages.edit.route, seriesPages.edit.handler)
app.get(seriesPages.standings.route, seriesPages.standings.handler)
app.get(seriesPages.matchups.route, seriesPages.matchups.handler)
app.get(seriesPages.importSeries.route, seriesPages.importSeries.handler)
app.get(seriesPages.editRound.route, seriesPages.editRound.handler)
app.get(seriesPages.newRound.route, seriesPages.newRound.handler)

app.post(seriesPages.post.route, seriesPages.post.handler)
app.post(seriesPages.remove.route, seriesPages.remove.handler)
app.post(seriesPages.saveRound.route, seriesPages.saveRound.handler)

app.get(playoffSeriesPages.list.route, playoffSeriesPages.list.handler)
app.get(playoffSeriesPages.create.route, playoffSeriesPages.create.handler)
app.get(playoffSeriesPages.edit.route, playoffSeriesPages.edit.handler)
app.get(playoffSeriesPages.bracket.route, playoffSeriesPages.bracket.handler)

app.post(playoffSeriesPages.post.route, playoffSeriesPages.post.handler)
app.post(playoffSeriesPages.remove.route, playoffSeriesPages.remove.handler)

app.get(playerPages.list.route, playerPages.list.handler)
app.get(playerPages.captains.route, playerPages.captains.handler)
app.get(playerPages.standins.route, playerPages.standins.handler)
app.get(playerPages.create.route, playerPages.create.handler)
app.get(playerPages.edit.route, playerPages.edit.handler)
app.get(playerPages.csv.route, playerPages.csv.handler)
app.get(playerPages.activityCheck.route, playerPages.activityCheck.handler)
app.get(playerPages.activityCheckAdmin.route, playerPages.activityCheckAdmin.handler)
app.get(playerPages.json.route, playerPages.json.handler)
app.get(playerPages.countJson.route, playerPages.countJson.handler)

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

app.get(bannedPlayerPages.list.route, bannedPlayerPages.list.handler)
app.get(bannedPlayerPages.create.route, bannedPlayerPages.create.handler)
app.get(bannedPlayerPages.edit.route, bannedPlayerPages.edit.handler)

app.post(bannedPlayerPages.post.route, bannedPlayerPages.post.handler)
app.post(bannedPlayerPages.remove.route, bannedPlayerPages.remove.handler)

app.get(ipPages.list.route, ipPages.list.handler)

//Pull the list of Steam servers if it exists
if (fs.existsSync(path.join(__dirname, 'assets', 'servers.json'))) {
  Steam.servers = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets', 'servers.json')))
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

      // Commenting this out because it is causing issues for now on node10
      // steam.on('servers', servers => {
      //   fs.writeFile(path.join(__dirname, 'assets', 'servers.js'), JSON.stringify(servers));
      // })

      steam.on('error', err => {
        console.error(err)
        if (err.message === 'Disconnected') {
          steam.connect()
        }
        else {
          throw err
        }
      })

      //If we aren't using MMR/Rank fetching, there is no point for this
      const repeat = () => {
        steam_user.getSteamUsers().then(users => {
          setTimeout(() => {
            users.forEach((user, index) => {
              setTimeout(() => {
                return mmr.getMMR(user.steam_id).then(mmr => {
                  user.rank = mmr && mmr.rank ? mmr.rank : user.rank
                  user.previous_rank = mmr && mmr.previous_rank ? mmr.previous_rank : user.previous_rank

                  if(user.previous_rank == null) {
                    user.previous_rank = 0
                  }

                  if(user.rank == null) {
                    user.rank = 0
                  }
                  user.solo_mmr = 0
                  user.party_mmr = 0

                  return steam_user.saveSteamUser(user)
                })
              }, 1000 * (index + 1))
            })
          }, 10000)
        }).catch(err => {
          console.error(err)
          console.log('Error recovered - continuing')
        })
        setTimeout(repeat, 60*60*1000)
      }
      repeat()
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
