# Getting Souvari online with Cloudflare (stable URL, own domain)

Goal: expose the app already running on the **clinic Windows PC** as a permanent
`https://your-domain.com` using a **Cloudflare named tunnel**. Hosting stays $0
(your own PC + Cloudflare free plan); the only cost is the domain (~$10-16/yr).

## What changed in the repo (already done)

- `server/src/app.ts` now serves the built React app (`client/dist`) and falls
  back to `index.html` for client routes (e.g. `/admin/calendar`), so **one
  Node process hosts the UI + API on the same origin**. Unknown `/api/*` still
  return JSON 404. In dev (no `client/dist`) it is skipped, so `npm run dev`
  behaves exactly as before.
- Fixed the 5 pre-existing TypeScript errors + a declaration-emit error so
  `npm run build` in `server/` exits cleanly (previously it emitted `dist` but
  failed with exit code 1 - a deploy script would have aborted).

## Prerequisites (on the clinic PC)

- Windows 10/11, Git, **Node 20.11+ LTS** (nvm-windows or nodejs.org installer),
  MySQL 8 running with the existing `iave_clinic` database.
- A Cloudflare account.
- Internet/outbound access (Cloudflare Tunnel works behind NAT; no router
  changes needed).

## Step 1 - Buy the domain (Cloudflare Registrar)

1. Log in at dash.cloudflare.com.
2. **Register Domain** -> pick a domain (e.g. `souvari-skin-lab.com`), checkout.
   Registrar DNS is on Cloudflare automatically, so the zone is ready.
3. Skip the "changes detected" warnings - we add DNS below via the tunnel.

## Step 2 - Deploy the code + server (one batch)

1. Copy the `deploy/cloudflare-clinic/` folder to `C:\clinic\` on the clinic PC.
2. Right-click **setup-server.bat** -> **Run as administrator**.
   - It clones/pulls `https://github.com/Kurt-De-Asis/souvari-skin-lab-cms.git`
     to `C:\clinic\souvari-skin-lab-cms`, installs deps, builds, runs
     `prisma migrate deploy`, and starts the API under **PM2**.
   - When it pauses, edit `C:\clinic\souvari-skin-lab-cms\server\.env`:
     - `DATABASE_URL` -> your real MySQL password.
     - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` -> two random hex strings
       (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
     - `FRONTEND_URL` / `BACKEND_URL` -> your new domain (https).
     - `TZ=Asia/Manila` so the 8 AM reminder batch fires at local time.
     - `SMS_PROVIDER=semaphore` + `SMS_API_KEY` + `SMS_SENDER` when you want
       real texts (leave `mock` for now).
   - It registers an on-login start task, so the server comes back after a
     reboot.
3. Check it locally: on that PC browse `http://localhost:3000` - you should see
   the login page, and `pm2 list` should show `souvari-api` online.

## Step 3 - Cloudflare tunnel

1. Install `cloudflared` on the clinic PC:
   - `choco install cloudflared`, or download `cloudflared-windows-amd64.exe`
     from https://github.com/cloudflare/cloudflared/releases and put it in PATH.
2. Run **setup-tunnel.bat** (as administrator). It:
   - `cloudflared tunnel login` (browser OAuth - approve access).
   - `cloudflared tunnel create souvari`.
   - `cloudflared tunnel route dns souvari <your-domain.com>` (creates the
     `CNAME` in Cloudflare DNS automatically).
   - Prints the tunnel token.
3. Install it as a Windows service so it auto-starts on boot:
   ```
   cloudflared service install <paste_token_here>
   ```
4. Verify:
   ```
   cloudflared tunnel info souvari
   ```
   Service state: `services.msc` -> `Cloudflare Tunnel Agent` = Running.

## Step 4 - Cut over + checks

1. Open `https://your-domain.com/api/health` -> expect the health JSON.
2. Log in at `https://your-domain.com` with the admin account.
3. Book an appointment end-to-end (or at least browse services + booking page).
4. Next 8 AM, check the API log shows `[REMINDER] Batch complete:
   ... reminded, ... failed`. (`pm2 logs souvari-api`)
5. If desired, enable SMS now (see `.env` note above) and restart:
   `pm2 restart souvari-api`.

## Security - do this before telling anyone the URL

- The seeded demo admin/staff accounts are now on the public internet.
  **Change the admin password** (and any staff/customer demo passwords) first.
- The AI key lives only in `server\.env` - never put it in the client.
- Consider Cloudflare WAF rules (dashboard, free plan) / restricting access if
  only the clinic team should reach it yet.

## Backups (Cloudflare is a tunnel - it does NOT back up your data)

1. Edit the `MYSQL_BIN` path and `DB_PASS` at the top of `backup-db.bat`.
2. Register a nightly task (run once):
   ```
   schtasks /create /f /tn "SouvariBackup" /sc daily /st 01:30 /tr "\"C:\clinic\backup-db.bat\""
   ```
3. Periodically copy `C:\clinic\backups\` elsewhere (USB/Drive).

## Operations / troubleshooting

| Symptom | Fix |
|---|---|
| `your-domain.com` hangs or DNS not resolving | Tunnel service must be **Running**; `cloudflared tunnel info souvari`; DNS `CNAME` present in Cloudflare. |
| Site shows but API calls fail | `pm2 logs souvari-api`; confirm `server\.env` `FRONTEND_URL`/`BACKEND_URL` = https domain; restart `pm2 restart souvari-api`. |
| PC rebooted, site down | Server restarts on login (task `SouvariServer`); tunnel is a service. Make sure someone logs into Windows, or use a service account. |
| `prisma migrate deploy` fails | `DATABASE_URL` wrong; DB user password. |
| Reminders never fire | `REMINDERS_ENABLED=false`? `TZ` not Asia/Manila? Server process off? Check `pm2 logs`. |

## Where this leaves you

This is the "easiest" production shape: one machine, PM2 + cloudflared service,
zero hosting spend. When the clinic eventually wants a dedicated always-on host
outside the clinic PC, the same and code and `dist` bundle deploy to Railway or
a VPS unchanged (the static-serving change is already in place).