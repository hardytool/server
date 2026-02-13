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
    user?: Express.User | false,
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
  import { Options } from 'pug'
  type TemplateMap = Record<string, (locals?: object) => string>
  function pugTree(dir: string, options?: Options): TemplateMap
  export = pugTree
}

declare module 'pg-sql' {
  interface SqlQuery {
    text: string
    values: unknown[]
  }
  function sql(strings: TemplateStringsArray, ...values: unknown[]): SqlQuery
  namespace sql {
    function join(parts: SqlQuery[], separator?: string): SqlQuery
    function raw(text: string): SqlQuery
  }
  export = sql
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
    [key: string]: unknown
  }
  function connectPgSimple(session: typeof import('express-session')): new (options: PgSessionOptions) => session.Store
  export = connectPgSimple
}

declare module 'redirect-https' {
  import { RequestHandler } from 'express'
  interface RedirectOptions {
    port?: number
    [key: string]: unknown
  }
  function redirectHttps(options?: RedirectOptions): RequestHandler
  export = redirectHttps
}

declare module 'edmonds-blossom' {
  type Edge = [number, number, number]
  function blossom(edges: Edge[], check?: boolean): number[]
  export = blossom
}

declare module 'swiss-pairing' {
  interface Player {
    id: number | string
    score: number
    [key: string]: unknown
  }
  interface PairingOptions {
    players: Player[]
    rounds?: number
    [key: string]: unknown
  }
  function swissPairing(options: PairingOptions): Array<[Player, Player]>
  export = swissPairing
}

declare module 'markdown-it-classy' {
  import MarkdownIt from 'markdown-it'
  const plugin: MarkdownIt.PluginSimple
  export = plugin
}
