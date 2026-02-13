# TypeScript Refactor Plan

## Codebase Summary

- **45 JavaScript files**, ~6,141 lines of code
- **Module system:** CommonJS (`require` / `module.exports`)
- **Pattern:** Factory functions with dependency injection throughout
- **Runtime:** Node.js, run directly (no bundler)
- **Async style:** Bluebird promises (no async/await)
- **Key layers:** `lib/`, `repos/`, `api/`, `pages/`, `server.js`
- **No existing TypeScript**, no `tsconfig.json`, no test framework

---

## Guiding Principles

1. **Incremental migration** — convert file-by-file without breaking the running application.
2. **Keep CommonJS** — no ESM migration; TypeScript will compile to `"module": "commonjs"`.
3. **Strict mode from day one** — `"strict": true` in tsconfig catches the most bugs.
4. **Async/await modernisation** — replace Bluebird promises with native `async/await` during conversion (Bluebird adds no value in modern Node.js).
5. **Types before code** — define shared interfaces in a `src/types/` directory first so each converted file can reference them immediately.
6. **No functionality changes** — this is a refactor; behaviour must be identical before and after.

---

## Phase 1 — TypeScript Infrastructure Setup

### 1.1 Install dependencies

```bash
npm install --save-dev typescript ts-node @types/node @types/express \
  @types/passport @types/express-session @types/cookie-parser \
  @types/body-parser @types/pg @types/bluebird @types/markdown-it \
  @types/shortid @types/pug
```

> Note: `passport-steam`, `pug-tree`, `pg-sql`, `edmonds-blossom`,
> `swiss-pairing`, `connect-pg-simple`, `csrf-csrf`, and `redirect-https`
> have no official `@types` packages. Minimal ambient declarations will be
> written in `src/types/vendor.d.ts`.

### 1.2 Add `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.3 Update `package.json` scripts

```jsonc
{
  "main": "dist/server.js",
  "scripts": {
    "build":  "tsc",
    "start":  "node dist/server.js",
    "dev":    "nodemon --exec 'ts-node src/server.ts' -e pug,ts",
    "test":   "tsc --noEmit && eslint src",
    "docker": "docker build -t rd2l/server ."
  }
}
```

### 1.4 Update Dockerfile

Replace `node src/server.js` with a two-stage build:
```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Run stage
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY src/assets ./dist/assets
COPY src/templates ./dist/templates
COPY src/migrations ./dist/migrations
CMD ["node", "dist/server.js"]
```

### 1.5 Update ESLint for TypeScript

Install `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`, then update `eslint.config.cjs` to lint `.ts` files.

### 1.6 Add `src/types/` directory

Create the following files:

| File | Purpose |
|------|---------|
| `src/types/vendor.d.ts` | Ambient module declarations for untyped packages |
| `src/types/db.ts` | Database row interfaces (Player, Team, Series, etc.) |
| `src/types/express.d.ts` | Augment `Express.User` and `Request` with session fields |
| `src/types/config.ts` | Config and Env interfaces |

---

## Phase 2 — Shared Type Definitions (`src/types/`)

Define interfaces for every database entity returned by the repos layer.
These become the shared contract between repos, pages, and API controllers.

**Entities to type** (derived from repo functions and SQL queries):

- `Player`, `PlayerRole`, `PlayerProfile`
- `Team`, `TeamPlayer`
- `Season`, `Division`
- `Series`, `PlayoffSeries`
- `Admin`, `AdminGroup`
- `Role`
- `SteamUser`
- `BannedPlayer`
- `IpAddress`, `Vouch`
- `Config`, `DbConfig`, `ServerConfig`

**Express augmentation** (`src/types/express.d.ts`):
```typescript
declare global {
  namespace Express {
    interface User {
      id: string
      steamId: string
      profile: SteamProfile
      isAdmin: boolean
      // ... other inflated user fields
    }
  }
}
```

---

## Phase 3 — Convert `src/lib/` (7 files, lowest complexity)

Convert in this order (simplest first):

1. `lib/timeout.js` → `lib/timeout.ts`
2. `lib/wait.js` → `lib/wait.ts`
3. `lib/interval.js` → `lib/interval.ts`
4. `lib/csv.js` → `lib/csv.ts`
5. `lib/steamId.js` → `lib/steamId.ts`
6. `lib/emojify.js` → `lib/emojify.ts`
7. `lib/auth.js` → `lib/auth.ts` (depends on repo types from Phase 2)

**Key changes per file:**
- Replace `module.exports = ...` with `export` / `export default`
- Replace `require()` with `import`
- Add return type annotations to all exported functions
- Replace Bluebird `.then()/.catch()` chains with `async/await`

---

## Phase 4 — Convert `src/repos/` (16 files)

Each repo is a factory: `module.exports = (pool: pg.Pool) => ({ ... })`.

**Type the factory signature:**
```typescript
import { Pool } from 'pg'
export function createPlayerRepo(pool: Pool) { ... }
```

**Convert in this order** (fewest inter-repo dependencies first):

1. `repos/migration.js`
2. `repos/role.js`
3. `repos/admin_group.js`
4. `repos/banned_player.js`
5. `repos/ip_address.js`
6. `repos/steam_user.js`
7. `repos/admin.js`
8. `repos/division.js`
9. `repos/season.js`
10. `repos/profile.js`
11. `repos/vouch.js`
12. `repos/player_role.js`
13. `repos/player.js`
14. `repos/team.js`
15. `repos/team_player.js`
16. `repos/series.js`

**Key changes per file:**
- Type the `pool` parameter as `pg.Pool`
- Type all function parameters and return values (e.g., `Promise<Player[]>`)
- Replace `pg-sql` tagged template calls with explicit return types
- Replace Bluebird with native `async/await`
- Replace `module.exports` with named exports

---

## Phase 5 — Convert `src/api/` (4 files)

1. `api/openid.js` → `api/openid.ts`
2. `api/divisions.js` → `api/divisions.ts`
3. `api/seasons.js` → `api/seasons.ts`
4. `api/players.js` → `api/players.ts`

**Type the route handler shape:**
```typescript
interface RouteHandler {
  route: string
  handler: express.RequestHandler
}
```

---

## Phase 6 — Convert `src/pages/` (16 files)

Convert in dependency order. Each page factory accepts typed repo instances.

1. `pages/index.js`
2. `pages/roles.js`
3. `pages/admins.js`
4. `pages/admin_groups.js`
5. `pages/banned_players.js`
6. `pages/ips.js`
7. `pages/seasons.js`
8. `pages/divisions.js`
9. `pages/teams.js`
10. `pages/roster.js`
11. `pages/profile.js`
12. `pages/players.js`
13. `pages/registration.js`
14. `pages/series.js`
15. `pages/playoffSeries.js`

**Key changes:**
- Type all factory parameters using repo return types from Phase 4
- Type `req`, `res` as `express.Request`, `express.Response`
- Replace Bluebird chains with `async/await`
- Handle `req.user` using the augmented Express namespace from Phase 2

---

## Phase 7 — Convert Root Files

1. `src/env.js` → `src/env.ts`
2. `src/config.js` → `src/config.ts` (use `Config` interface from Phase 2)
3. `src/server.js` → `src/server.ts` (ties everything together)

`server.ts` will be the last file converted since it imports every other module.

---

## Phase 8 — Validation & Cleanup

1. Run `tsc --noEmit` — resolve all remaining type errors
2. Run `eslint src` — fix any lint warnings
3. Run the application locally with `ts-node src/server.ts` and verify all routes work
4. Build the production bundle with `npm run build` (`tsc`) and verify `dist/` starts correctly
5. Update `dev.Dockerfile` to use `ts-node`
6. Remove all original `.js` source files once `.ts` equivalents are verified
7. Update `nodemon` config to watch `.ts` extensions

---

## File Conversion Order Summary

```
Phase 1:  Infrastructure (tsconfig, package.json, Dockerfile, ESLint)
Phase 2:  src/types/ (db.ts, config.ts, express.d.ts, vendor.d.ts)
Phase 3:  src/lib/    (7 files)
Phase 4:  src/repos/  (16 files)
Phase 5:  src/api/    (4 files)
Phase 6:  src/pages/  (15 files)
Phase 7:  src/env.ts, src/config.ts, src/server.ts
Phase 8:  Validation, cleanup, remove .js files
```

Total: ~45 files converted across 8 phases.

---

## Risk & Mitigation

| Risk | Mitigation |
|------|------------|
| `pg-sql` has no types | Write ambient `declare module 'pg-sql'` with typed tag function |
| `passport-steam` has no types | Write ambient declaration for `Strategy` class |
| `pug-tree` has no types | Write ambient declaration returning `Record<string, Function>` |
| Bluebird-specific API used (`.map`, `.props`, etc.) | Audit during conversion; replace with `Promise.all` / native equivalents |
| `strict: true` may surface many implicit `any` errors | Use `// @ts-expect-error` sparingly during initial pass; resolve before merge |
| Dockerfile copies compiled output but misses assets/templates/migrations | Explicit `COPY` directives in multi-stage Dockerfile for non-TS assets |
