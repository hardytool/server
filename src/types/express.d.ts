// ---------------------------------------------------------------------------
// Express namespace augmentations
// ---------------------------------------------------------------------------
import 'express-session'

declare global {
  namespace Express {
    interface User {
      steam_id: string
      name: string
      avatar: string
      solo_mmr: number
      party_mmr: number
      rank: number
      previous_rank: number
      // Fields added by inflateUser()
      isAdmin?: boolean
      displayName?: string
      steamId?: string
      theme?: string
      activityCheckRequired?: boolean
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    returnTo?: string
  }
}
