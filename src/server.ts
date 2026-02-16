// Configuration
import configFactory from './config'
const config = configFactory()

// Node & NPM
import path from 'path'
import http from 'http'
import express from 'express'
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
import apiRulesFactory from './api/rules'
import apiProfilesFactory from './api/profiles'
import apiTeamsFactory from './api/teams'
import apiSeriesApiFactory from './api/series'
import apiRegistrationFactory from './api/registration'
import apiAdminFactory from './api/admin'
import apiSeasonsAdminFactory from './api/seasons-admin'
import apiDivisionsAdminFactory from './api/divisions-admin'
import apiPlayersAdminFactory from './api/players-admin'
const apiDivisions = apiDivisionsFactory(division, admin)
const apiSeasons = apiSeasonsFactory(season)
const apiPlayers = apiPlayersFactory(season, division, player, player_role, role)
const apiMe = apiMeFactory()
const apiRules = apiRulesFactory(
  path.join(__dirname, 'assets', 'rules.md'),
  path.join(__dirname, 'assets', 'inhouserules.md'))
const apiProfiles = apiProfilesFactory(profile, steam_user, team_player, vouch)
const apiTeams = apiTeamsFactory(team, team_player)
const apiSeriesApi = apiSeriesApiFactory(season, team, series, division, pairings)
const apiRegistration = apiRegistrationFactory(season, division, player, player_role)
const apiAdminApi = apiAdminFactory(admin, admin_group, banned_player, role, ip_address)
const apiSeasonsAdmin = apiSeasonsAdminFactory(season)
const apiDivisionsAdmin = apiDivisionsAdminFactory(division)
const apiPlayersAdmin = apiPlayersAdminFactory(season, division, player, role, player_role)

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
  getCsrfTokenFromRequest: (req) => (req.headers['x-csrf-token'] as string) || (req.body && req.body._csrf),
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

const apiCsrf = apiCsrfFactory(generateCsrfToken)
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

app.get('/auth/steam', passport.authenticate('steam'))
app.get('/auth/steam/return',
  passport.authenticate('steam', {
    failureRedirect: config.server.website_url ? config.server.website_url as string : '/'
  }),
  openid.steamIdReturn)
app.get('/logout', openid.logout)

app.get(apiDivisions.list.route, apiDivisions.list.handler)
app.get(apiDivisions.view.route, apiDivisions.view.handler)

app.get(apiSeasons.list.route, apiSeasons.list.handler)
app.get(apiSeasons.view.route, apiSeasons.view.handler)

app.get(apiPlayers.list.route, apiPlayers.list.handler)
app.get(apiPlayers.captains.route, apiPlayers.captains.handler)

// New JSON API endpoints for SPA
app.get(apiMe.me.route, apiMe.me.handler)
app.get(apiCsrf.csrfToken.route, apiCsrf.csrfToken.handler)

app.get(apiRules.rules.route, apiRules.rules.handler)
app.get(apiRules.inhouseRules.route, apiRules.inhouseRules.handler)

app.get(apiProfiles.view.route, apiProfiles.view.handler)
app.put(apiProfiles.update.route, apiProfiles.update.handler)
app.post(apiProfiles.addVouch.route, apiProfiles.addVouch.handler)
app.delete(apiProfiles.removeVouch.route, apiProfiles.removeVouch.handler)

app.get(apiTeams.listByDivision.route, apiTeams.listByDivision.handler)
app.get(apiTeams.view.route, apiTeams.view.handler)
app.post(apiTeams.save.route, apiTeams.save.handler)
app.delete(apiTeams.remove.route, apiTeams.remove.handler)
app.get(apiTeams.getRoster.route, apiTeams.getRoster.handler)
app.post(apiTeams.addToRoster.route, apiTeams.addToRoster.handler)
app.delete(apiTeams.removeFromRoster.route, apiTeams.removeFromRoster.handler)
app.get(apiTeams.getUnassigned.route, apiTeams.getUnassigned.handler)

app.get(apiSeriesApi.list.route, apiSeriesApi.list.handler)
app.post(apiSeriesApi.save.route, apiSeriesApi.save.handler)
app.delete(apiSeriesApi.remove.route, apiSeriesApi.remove.handler)
app.get(apiSeriesApi.standings.route, apiSeriesApi.standings.handler)
app.get(apiSeriesApi.standingsByRound.route, apiSeriesApi.standingsByRound.handler)
app.get(apiSeriesApi.matchups.route, apiSeriesApi.matchups.handler)
app.get(apiSeriesApi.matchupsByRound.route, apiSeriesApi.matchupsByRound.handler)
app.get(apiSeriesApi.getCurrentRound.route, apiSeriesApi.getCurrentRound.handler)
app.post(apiSeriesApi.saveRound.route, apiSeriesApi.saveRound.handler)
app.get(apiSeriesApi.listPlayoff.route, apiSeriesApi.listPlayoff.handler)
app.post(apiSeriesApi.savePlayoff.route, apiSeriesApi.savePlayoff.handler)
app.delete(apiSeriesApi.removePlayoff.route, apiSeriesApi.removePlayoff.handler)
app.get(apiSeriesApi.bracket.route, apiSeriesApi.bracket.handler)

app.get(apiRegistration.getRegistration.route, apiRegistration.getRegistration.handler)
app.post(apiRegistration.register.route, apiRegistration.register.handler)
app.delete(apiRegistration.unregister.route, apiRegistration.unregister.handler)

app.get(apiAdminApi.listAdmins.route, apiAdminApi.listAdmins.handler)
app.post(apiAdminApi.saveAdmin.route, apiAdminApi.saveAdmin.handler)
app.delete(apiAdminApi.deleteAdmin.route, apiAdminApi.deleteAdmin.handler)
app.get(apiAdminApi.listAdminGroups.route, apiAdminApi.listAdminGroups.handler)
app.post(apiAdminApi.saveAdminGroup.route, apiAdminApi.saveAdminGroup.handler)
app.delete(apiAdminApi.deleteAdminGroup.route, apiAdminApi.deleteAdminGroup.handler)
app.get(apiAdminApi.listBanned.route, apiAdminApi.listBanned.handler)
app.post(apiAdminApi.saveBanned.route, apiAdminApi.saveBanned.handler)
app.delete(apiAdminApi.deleteBanned.route, apiAdminApi.deleteBanned.handler)
app.get(apiAdminApi.listRoles.route, apiAdminApi.listRoles.handler)
app.post(apiAdminApi.saveRole.route, apiAdminApi.saveRole.handler)
app.delete(apiAdminApi.deleteRole.route, apiAdminApi.deleteRole.handler)
app.get(apiAdminApi.listIps.route, apiAdminApi.listIps.handler)

app.post(apiSeasonsAdmin.save.route, apiSeasonsAdmin.save.handler)
app.delete(apiSeasonsAdmin.remove.route, apiSeasonsAdmin.remove.handler)

app.get(apiDivisionsAdmin.listAll.route, apiDivisionsAdmin.listAll.handler)
app.post(apiDivisionsAdmin.save.route, apiDivisionsAdmin.save.handler)
app.delete(apiDivisionsAdmin.remove.route, apiDivisionsAdmin.remove.handler)

app.get(apiPlayersAdmin.standins.route, apiPlayersAdmin.standins.handler)
app.delete(apiPlayersAdmin.remove.route, apiPlayersAdmin.remove.handler)
app.post(apiPlayersAdmin.activityCheck.route, apiPlayersAdmin.activityCheck.handler)
app.post(apiPlayersAdmin.activityCheckAdmin.route, apiPlayersAdmin.activityCheckAdmin.handler)
app.get(apiPlayersAdmin.draftsheetCsv.route, apiPlayersAdmin.draftsheetCsv.handler)


// Serve the Vue SPA for all non-API, non-asset routes
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')))
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'))
})

http.createServer(app).listen(config.server.port, () => {
  console.log('Listening to HTTP connections on port ' + config.server.port)
})

// Application end
