// ---------------------------------------------------------------------------
// Express namespace augmentations
// ---------------------------------------------------------------------------
import 'express-session'

// Shape of the Steam profile returned by passport-steam and stored in the
// passport session by serializeUser.
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

// The raw object written into the session by serializeUser:
//   done(null, { id: identifier, profile: profile })
interface SerializedUser {
  id: string            // Steam OpenID identifier URL
  profile: SteamProfile
}

declare global {
  namespace Express {
    // After inflateUser() runs in deserializeUser, req.user has all of the
    // SerializedUser fields plus the fields injected by auth.inflateUser().
    interface User extends SerializedUser {
      // Injected by inflateUser()
      isAdmin: boolean
      avatar: string        // full-size avatar URL
      displayName: string   // custom or Steam display name from profile table
      steamId: string       // Steam32 ID (converted from profile.id via from64to32)
      theme: string
      activityCheckRequired: boolean
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    // Added by the csrf-csrf middleware in server.js
    csrfToken?(): string
  }
}

declare module 'express-session' {
  interface SessionData {
    returnTo?: string
  }
}
