// Configuration
import configFactory from './config'
const config = configFactory()

// Node & NPM
import path from 'path'
import http from 'http'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { doubleCsrf } from 'csrf-csrf'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import passport from 'passport'
import passportSteam from 'passport-steam'
import pg from 'pg'
const pool = new pg.Pool({
  ...config.db,
  user: config.db.user || undefined,
  password: config.db.password || undefined,
  database: config.db.database || undefined,
  port: Number(config.db.port),
  max: Number(config.db.max),
  idleTimeoutMillis: Number(config.db.idleTimeoutMillis),
})
import connectPgSimple from 'connect-pg-simple'
const PGStore = connectPgSimple(session)
import pugTree from 'pug-tree'
const templates = pugTree(path.join(__dirname, 'templates'), config.templates)
import swissPairing from 'swiss-pairing'
const pairings = swissPairing({ maxPerRound: 2 })

// repositories
import adminRepo from './repos/admin'
import adminGroupRepo from './repos/admin_group'
import bannedPlayerRepo from './repos/banned_player'
import divisionRepo from './repos/division'
import ipAddressRepo from './repos/ip_address'
import playerRepo from './repos/player'
import playerRoleRepo from './repos/player_role'
import profileRepo from './repos/profile'
import roleRepo from './repos/role'
import seasonRepo from './repos/season'
import seriesRepo from './repos/series'
import steamUserRepo from './repos/steam_user'
import teamRepo from './repos/team'
import teamPlayerRepo from './repos/team_player'
import vouchRepo from './repos/vouch'
const admin = adminRepo(pool)
const admin_group = adminGroupRepo(pool)
const banned_player = bannedPlayerRepo(pool)
const division = divisionRepo(pool)
const ip_address = ipAddressRepo(pool)
const player = playerRepo(pool)
const player_role = playerRoleRepo(pool)
const profile = profileRepo(pool)
const role = roleRepo(pool)
const season = seasonRepo(pool)
const series = seriesRepo(pool)
const steam_user = steamUserRepo(pool)
const team = teamRepo(pool)
const team_player = teamPlayerRepo(pool)
const vouch = vouchRepo(pool)

// lib
import * as steamId from './lib/steamId'
import authFactory from './lib/auth'
const auth = authFactory(admin, steam_user, profile, steamId)

// Auth controller
import openidFactory from './api/openid'
const openid = openidFactory(config)

// API controllers
import apiDivisionsFactory from './api/divisions'
import apiSeasonsFactory from './api/seasons'
import apiPlayersFactory from './api/players'
import apiMeFactory from './api/me'
import apiCsrfFactory from './api/csrf'
const apiDivisions = apiDivisionsFactory(division, admin)
const apiSeasons = apiSeasonsFactory(season)
const apiPlayers = apiPlayersFactory(season, division, player, player_role, role)
const apiMe = apiMeFactory()
const apiCsrf = apiCsrfFactory()

// Page controllers
import adminsFactory from './pages/admins'
import adminGroupsFactory from './pages/admin_groups'
import bannedPlayersFactory from './pages/banned_players'
import divisionsFactory from './pages/divisions'
import indexFactory from './pages/index'
import ipsFactory from './pages/ips'
import playersFactory from './pages/players'
import playoffSeriesFactory from './pages/playoffSeries'
import profileFactory from './pages/profile'
import registrationFactory from './pages/registration'
import rosterFactory from './pages/roster'
import rolesFactory from './pages/roles'
import seasonsFactory from './pages/seasons'
import seriesPageFactory from './pages/series'
import teamsFactory from './pages/teams'

const adminPages = adminsFactory(templates, admin, division, admin_group)
const adminGroupPages = adminGroupsFactory(templates, admin_group)
const bannedPlayerPages = bannedPlayersFactory(templates, banned_player)
const divisionPages = divisionsFactory(templates, season, division, admin)
const indexPages = indexFactory(
  templates,
  path.join(__dirname, 'assets', 'rules.md'),
  path.join(__dirname, 'assets', 'inhouserules.md'))
const ipPages = ipsFactory(templates, steam_user, ip_address, steamId)
const playerPages = playersFactory(templates, season, division, player, player_role, role, steam_user)
const playoffSeriesPages = playoffSeriesFactory(templates, season, team, series, pairings)
const profilePages = profileFactory(templates, steam_user, profile, season, team_player, vouch, steamId, player)
const registrationPages = registrationFactory(
  templates, season, division, steam_user, team_player, player, role, player_role, profile)
const rosterPages = rosterFactory(templates, season, division, team, team_player, series)
const rolePages = rolesFactory(templates, role)
const seasonPages = seasonsFactory(templates, season, division)
const seriesPages = seriesPageFactory(templates, season, team, series, pairings, division)
const teamPages = teamsFactory(templates, season, division, team, team_player, player)

// Application start

const app = express()

const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => config.server.secret,
  getSessionIdentifier: (req) => req.session.id,
  cookieName: '_csrf',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.server.host !== 'localhost',
  },
  getCsrfTokenFromRequest: (req) =>
    (req.headers['x-csrf-token'] as string | undefined) ?? (req.body && req.body._csrf),
})

passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((user, done) => {
  auth.inflateUser(user as Express.User).then(inflated => {
    done(null, inflated)
  }).catch(err => {
    done(err, false)
  })
})

const realm = 'http' + (config.server.host === 'localhost' ? '' : 's') + '://' + config.server.host
passport.use('steam', new passportSteam.Strategy({
  returnURL: realm + '/auth/steam/return',
  realm: realm,
  apiKey: config.server.steam_api_key
}, (identifier, profile, done) => {
  auth.createUser(profile).then(() => {
    done(null, { id: identifier, profile: profile })
  }).catch(err => {
    done(err, false)
  })
}))

app.set('trust proxy', true)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser(config.server.secret))
app.use(session({
  store: new PGStore({
    pool: pool,
    createTableIfMissing: true
  }),
  cookie: {
    secure: true,
    maxAge: 1000 * 60 * 60 * 24 * 7
  },
  secret: config.server.secret,
  resave: true,
  saveUninitialized: true
}))
app.use(doubleCsrfProtection)
app.use((req, res, next) => {
  req.csrfToken = () => generateCsrfToken(req, res)
  next()
})
app.use(passport.initialize())
app.use(passport.session())
app.use((req, _, next) => {
  if (req.user && req.ip) {
    ip_address.saveIPAddress(req.ip, req.user.steamId).catch(err => {
      console.error(err)
    })
  }
  next()
})
app.use('/assets', express.static(path.join(__dirname, 'assets')))

// SPA — served at /app and all /app/* sub-paths.
// The built client assets land in dist/public/ after `npm run build:client`.
// This block must come before the page routes so the static middleware runs
// first, but the catch-all is registered at the bottom after all SSR routes.
app.use('/app', express.static(path.join(__dirname, 'public')))

// Auth endpoints trigger external Steam API calls — apply a strict limiter.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})
app.get('/auth/steam', authLimiter, passport.authenticate('steam'))
app.get('/auth/steam/return',
  authLimiter,
  passport.authenticate('steam', {
    failureRedirect: config.server.website_url ? config.server.website_url as string : '/'
  }),
  openid.steamIdReturn)
app.get('/logout', openid.logout)

app.get(apiMe.me.route, apiMe.me.handler)
app.get(apiCsrf.csrf.route, apiCsrf.csrf.handler)

app.get(apiDivisions.list.route, apiDivisions.list.handler)
app.get(apiDivisions.view.route, apiDivisions.view.handler)

app.get(apiSeasons.list.route, apiSeasons.list.handler)
app.get(apiSeasons.view.route, apiSeasons.view.handler)

app.get(apiPlayers.list.route, apiPlayers.list.handler)
app.get(apiPlayers.captains.route, apiPlayers.captains.handler)

// Rules pages read a markdown file from disk on every request.
const staticFileLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})
app.get(indexPages.home.route, indexPages.home.handler)
app.get(indexPages.complaint.route, indexPages.complaint.handler)
app.get(indexPages.rules.route, staticFileLimiter, indexPages.rules.handler)
app.get(indexPages.irules.route, staticFileLimiter, indexPages.irules.handler)
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

// Catch-all for the Vue SPA: any /app/* path that wasn't matched by the
// static middleware above (i.e. client-side routes) should return index.html
// so Vue Router can handle navigation on the client.
// Rate-limited because sendFile performs a file system read on every request.
const spaIndexLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})
app.get('/app/*splat', spaIndexLimiter, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

http.createServer(app).listen(config.server.port, () => {
  console.log('Listening to HTTP connections on port ' + config.server.port)
})

// Application end
