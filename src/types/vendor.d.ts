// ---------------------------------------------------------------------------
// Ambient module declarations for packages that lack @types definitions
// ---------------------------------------------------------------------------

declare module 'passport-steam' {
  import { Strategy as PassportStrategy } from 'passport'
  import { Request } from 'express'

  interface SteamProfile {
    id: string
    displayName: string
    photos: Array<{ value: string }>
    _json: {
      steamid: string
      personaname: string
      avatar: string
      avatarmedium: string
      avatarfull: string
      [key: string]: unknown
    }
  }

  type VerifyCallback = (
    err: Error | null,
    // The user object passed here is serialized directly into the session;
    // it does not need to conform to Express.User until after inflation.
    user?: object | false,
    info?: object
  ) => void

  type VerifyFunction = (
    identifier: string,
    profile: SteamProfile,
    done: VerifyCallback
  ) => void

  interface StrategyOptions {
    returnURL: string
    realm: string
    apiKey: string | false
    passReqToCallback?: boolean
  }

  class Strategy extends PassportStrategy {
    name: string
    constructor(options: StrategyOptions, verify: VerifyFunction)
    authenticate(req: Request, options?: object): void
  }
}

declare module 'pug-tree' {
  type TemplateMap = Record<string, (locals?: object) => string>
  function pugTree(dir: string, options?: Record<string, unknown>): TemplateMap
  export = pugTree
}

declare module 'pg-sql' {
  interface SqlQuery {
    text: string
    values: unknown[]
  }
  // The package exports { sql } — usage: require('pg-sql').sql or import { sql }
  type SqlTag = {
    (strings: TemplateStringsArray, ...values: unknown[]): SqlQuery
    join(parts: SqlQuery[], separator?: string): SqlQuery
    raw(text: string): SqlQuery
  }
  const sql: SqlTag
  export { sql }
}

declare module 'connect-pg-simple' {
  import session from 'express-session'
  import { Pool } from 'pg'
  interface PgSessionOptions {
    pool?: Pool
    tableName?: string
    schemaName?: string
    ttl?: number
    disableTouch?: boolean
    createTableIfMissing?: boolean
    [key: string]: unknown
  }
  function connectPgSimple(session: typeof import('express-session')): new (options: PgSessionOptions) => session.Store
  export = connectPgSimple
}

declare module 'edmonds-blossom' {
  type Edge = [number, number, number]
  function blossom(edges: Edge[], check?: boolean): number[]
  export = blossom
}

declare module 'swiss-pairing' {
  interface SwissPairingOptions {
    maxPerRound?: number
    [key: string]: unknown
  }
  interface MappedSeriesEntry {
    round: number
    home: { id: string | number | null; points: number | null }
    away: { id: string | number | null; points: number | null }
  }
  interface Pairings {
    getMatchups(round: number, teams: unknown[], series: MappedSeriesEntry[]): unknown[]
    getStandings(round: number, teams: unknown[], series: MappedSeriesEntry[]): unknown[]
  }
  // swiss-pairing is called as a factory: swissPairing({ maxPerRound: 2 })
  function swissPairing(options: SwissPairingOptions): Pairings
  export = swissPairing
}

declare module 'markdown-it-classy' {
  import MarkdownIt from 'markdown-it'
  const plugin: MarkdownIt.PluginSimple
  export = plugin
}

