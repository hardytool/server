# Plan: Seed Data Support

## Overview

Add support for importing seed data for testing and local development. The seed data will include 2 seasons, 2 divisions, 8 teams per (season, division) tuple (32 teams total), and at least 5 fake users per team (users reused across tuples). No match history or admins are seeded.

The solution follows the existing migration-style pattern: a standalone TypeScript script that connects to the database via the same config/pool setup, uses the existing repo layer for idempotent upserts, and is invoked as an npm script. Docker Compose will be updated to run the seed command on startup after migrations complete.

---

## Data to Seed

### Seasons (2)
| id  | number | name            | active | activity_check | registration_open |
|-----|--------|-----------------|--------|----------------|-------------------|
| 1   | 1      | Season 1        | false  | false          | false             |
| 2   | 2      | Season 2        | true   | false          | true              |

### Divisions (2)
| id  | name       | active | discord_url | start_time   | draft_sheet_url |
|-----|------------|--------|-------------|--------------|-----------------|
| 1   | Division A | true   | ""          | "Sunday 5pm" | ""              |
| 2   | Division B | true   | ""          | "Sunday 7pm" | ""              |

### Steam Users / Fake Players
- 40 fake users total (5 per team slot, reused across (season, division) tuples)
- Steam IDs use a known fake prefix (e.g., `7656119800000001` through `7656119800000040`)
- Names like `SeedPlayer01` through `SeedPlayer40`
- Solo MMR and party MMR assigned as plausible test values (e.g., 1000–6000)
- Rank derived from MMR (1–8 scale)

### Teams (8 per (season, division) tuple = 32 total)
- Names like `"Alpha"`, `"Bravo"`, `"Charlie"`, etc.
- Each team gets 5 players assigned via `team_player`
- The first player on each team is marked as captain (`is_captain = true`) and `captain_approved = true`, `will_captain = 'yes'`
- Players are drawn from the pool of 40 fake users, reused across different (season, division) combinations

### Players (registrations)
- Each of the 40 fake users is registered as a `player` row for every (season, division) tuple they appear in
- `will_captain`: first player per team = `'yes'`, rest = `'no'`
- `captain_approved`: true for the designated captain, false otherwise
- `is_draftable`: true for all
- No match history (no `series` rows created)

### Not seeded
- Admins / admin groups (beyond the existing migration `_` group)
- Series / match history
- Roles / player roles
- Vouches
- Banned players

---

## Implementation Steps

### Step 1 — Create the seed script

**File:** `src/seeds.ts`

- Standalone TypeScript entry point (not imported by `server.ts`)
- Imports `env`, `configFactory`, and `pg.Pool` using the same pattern as `server.ts`
- Imports all required repos: `season`, `division`, `steam_user`, `team`, `player`, `team_player`
- Defines all seed data as typed constants
- Runs all upserts sequentially; because all repos use `ON CONFLICT ... DO UPDATE`, re-running is safe (idempotent)
- Exits with code 0 on success, 1 on failure
- Does NOT start an HTTP server

### Step 2 — Add a build output for the seed script

The `tsconfig.json` already compiles everything under `src/` to `dist/`, so `src/seeds.ts` will automatically compile to `dist/seeds.js` with no tsconfig changes needed.

### Step 3 — Add an npm script

In `package.json`, add:
```json
"seed": "node dist/seeds.js"
```

This gives a simple, memorable command: `npm run seed`. Running it multiple times is safe due to idempotency.

### Step 4 — Copy seeds output in the Dockerfile

The Dockerfile's run stage copies `dist/` from the builder. Since `seeds.ts` is compiled by `tsc` as part of `npm run build`, `dist/seeds.js` is automatically present in the image. No Dockerfile changes are needed.

### Step 5 — Update `docker-compose.yml` to run seeds on startup

Change the server's `CMD` (via `command:` override in compose) so that after the app starts, seeds are also run. The cleanest approach that keeps the server running is to use a shell entrypoint that runs the seed import before starting the server:

```yaml
command: sh -c "node dist/seeds.js && npm start"
```

This ensures:
1. The database is already healthy (guaranteed by `depends_on: db: condition: service_healthy`)
2. Migrations run as part of `npm start` → `server.ts` startup (unchanged)
3. Seeds run after the server is fully started...

**Revised approach:** Seeds must run *after* migrations (which run inside `server.ts`). Running seeds before `npm start` would fail because migrations haven't run yet.

**Solution:** Extract migration execution into the server startup so it remains there, and run seeds as a post-start step—OR run seeds inside `server.ts` after migrations complete.

The simplest approach that avoids modifying `server.ts` significantly is:

- Run `npm start` (which runs migrations then starts HTTP server) **and** separately invoke `node dist/seeds.js` after the server is listening.
- But we can't wait for the HTTP server to be ready from within the compose command easily without a health check on the server itself.

**Final approach:** Keep `server.ts` untouched. Extract migrations into a standalone `migrate-cli.ts` and chain all three steps in the docker-compose `command:` override:

```
node dist/migrate-cli.js && node dist/seed-cli.js && npm start
```

When the server starts via `npm start`, its internal `migrateIfNeeded` call becomes a no-op (all migrations already applied). Seeds and migrations are purely CLI concerns — the server has no knowledge of either.

### Final File Plan

#### `src/seed-data.ts` (the seed logic module)
- Exports `seedData(pool: Pool): Promise<void>`
- Contains all seed constants and upsert calls

#### `src/seed-cli.ts` (the standalone CLI entry point)
- Creates its own pool from config
- Calls `seedData(pool)` and exits cleanly

#### `src/migrate-cli.ts` (the standalone migration entry point)
- Creates its own pool from config
- Calls `migration.migrateIfNeeded(...)` and exits cleanly

#### `package.json`
Add: `"migrate": "node dist/migrate-cli.js"` and `"seed": "node dist/seed-cli.js"`

#### `docker-compose.yml`
Override the default `CMD` with:
`command: sh -c "node dist/migrate-cli.js && node dist/seed-cli.js && npm start"`

#### `Dockerfile` / `server.ts`
No changes needed.

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/seed-data.ts` | **Create** — exports `seedData(pool)` with all seed upserts |
| `src/seed-cli.ts` | **Create** — CLI entry point that calls `seedData` and exits |
| `src/migrate-cli.ts` | **Create** — CLI entry point that runs migrations and exits |
| `package.json` | **Edit** — add `"migrate"` and `"seed"` npm scripts |
| `docker-compose.yml` | **Edit** — override command to chain migrate → seed → start |

---

## Idempotency Guarantee

All repo `save*` methods use `INSERT ... ON CONFLICT (id) DO UPDATE SET ...`, so re-running seeds never creates duplicates. The `team_player.addPlayerToTeam` uses `ON CONFLICT (player_id) DO UPDATE` as well. Running `npm run seed` (or restarting docker compose) any number of times is safe.

---

## Branch

All work on branch: `claude/add-seed-data-ubO3c`
