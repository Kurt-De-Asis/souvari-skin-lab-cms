# Upgrade Guide — Updating an Existing Souvari Skin Lab Install

This guide is for a computer where the **Souvari Skin Lab Clinic Management
System is already set up and running**, and you need to bring it up to date so it
has the **same services, staff, schedules, and contact details** as the owner's
database.

There are two situations:

| Situation | What to do |
|-----------|------------|
| **A. The computer already has the system and you want to keep its data** | Follow **Path A** below. It adds the real services, staff, and schedules without wiping existing customers/appointments. |
| **B. The computer is a demo/old test install with nothing important in it** | Follow **Path B** below. A full reset is faster and cleaner. |

> **Golden rule:** NEVER run `npx prisma migrate reset` (or re-run `setup.bat`)
> on a machine that has real data in it — that deletes everything. Use Path A.

---

## Path A — Refresh a Running Install (Safe)

### Step A1 — Back up the database (2 minutes)

Before changing anything, make a backup so nothing is lost if something goes
wrong. Open a **Command Prompt** and run:

```bat
mysqldump -u root -p dbname > backup-souvari.sql
```

- Replace `dbname` with the database name from `server\.env` — usually
  `iave_clinic`.
- Replace `root` with your MySQL username if it's different.
- Type your MySQL password when prompted.
- Keep the `backup-souvari.sql` file somewhere safe. To restore it later:

```bat
mysql -u root -p dbname < backup-souvari.sql
```

### Step A2 — Update the project files

Copy the **new project folder** over the old one (or run `git pull` if you use
Git), then in a command prompt inside the project folder reinstall dependencies:

```bat
call npm install
call cd server && call npm install
call cd .. && call cd client && call npm install
call cd ..
```

### Step A3 — Apply any database changes (does NOT delete data)

From the `server` folder:

```bat
cd server
npx prisma generate
npx prisma migrate deploy
```

- `migrate deploy` only adds/updates table structure. It leaves all your existing
  records alone.
- If it says everything is already up to date, that's fine — just continue.
- Do **not** use `npx prisma migrate dev` here unless you're a developer and know
  what it does (it can ask to reset the database).

### Step A4 — Load the real services, staff, schedules, and assignments

Still inside the `server` folder, run the single command that loads everything:

```bat
npm run db:seed:all
```

This runs, in order:

| Seed step | What it does | Safe? |
|-----------|--------------|-------|
| base demo data | demo accounts/customers/products | ✅ upserts |
| service catalog | the full ~240-service Souvari catalog, variants & packages | ✅ upserts |
| memberships | the VIP membership plans & benefits | ✅ upserts |
| loyalty | loyalty milestones & reward rules | ✅ deletes & rebuilds loyalty rules only |
| employees | the **real staff** + their schedules (Owner, Gian Heart, Princess Ashly, Jocelyn, Jobelle, Rica May, Wendy Jane, Queenie Rose) | ⚠️ **deletes ALL existing staff first** |
| service–staff | assigns the right staff to each service | ✅ rebuilds assignments |

> ⚠️ **Warning about the "employees" step:** it removes the old staff accounts
> (e.g. `maria.santos@iave.local`) and installs the real Souvari team. Any
> appointments/transactions linked to those old staff are removed with them.
> **This is why Step A1 (backup) comes first.** If the clinic has real history
> they care about, keep the backup so it can be restored if needed.

When it finishes you should see log lines like:
- `N services, N variants seeded.`
- `Total staff in database: 8`
- `Created N service_staff assignments`

### Step A5 — Update the clinic contact info

The map position, address, and phone in the code are now updated automatically
when you use the new files. The on-screen **Settings page** still shows the old
text until you fix it once:

1. Log in as **Admin** (see the logins below).
2. Go to **Settings**.
3. Update:
   - Address: `2nd Floor, The District Dasmariñas, Molino-Paliparan Rd., Dasmariñas, Cavite`
   - Phone: `+63 981 689 9909`
   - Email: `souvariskinlab@gmail.com`
4. Save.

This is the value the AI chatbot and the "Get in touch" blocks read from, so
keep it correct.

### Step A6 — Restart and check

1. Close any running terminal/window of the system (press `Ctrl + C`).
2. Start again:
   - double-click `start.bat`, **or**
   - run `npm run dev` from the project root.
3. Open http://localhost:5173 and press **Ctrl + F5** (hard refresh) so the
   browser loads the new styles/code.
4. Check:
   - **Contact page** → the map now shows **Souvari Skin Lab** (District Dasmariñas).
   - **Admin → Services** → the full catalog.
   - **Admin → Staff** → the real team with their schedules.

---

## Path B — Full Reset (only for a machine with nothing important in it)

If the machine is a demo/test install and you want a guaranteed clean start that
matches the owner's database exactly:

```bat
copy the new project folder over the old one
run setup.bat        (creates a fresh database with ALL the real data)
```

`setup.bat` now runs the complete data chain automatically, so after it you're
done. See **docs/SETUP-QUICK.md**.

If the system is already installed and you just want to wipe and rebuild the
database in place:

```bat
cd server
npx prisma migrate reset --force
npm run db:seed:all
cd ..
```

> `migrate reset` **erases the entire database** first — only use it when losing
> the current data is acceptable.

---

## Logins after the upgrade (password for all: `password123`)

| Role | Email |
|------|-------|
| Admin (owner) | `souvariskinlab@gmail.com` |
| Staff sample | `gianheartdaygon24@gmail.com` |
| Customer sample | `juan.delacruz@email.com` |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Can't connect to MySQL` / `ECONNREFUSED` | MySQL isn't running, or the credentials in `server\.env` are wrong. Start MySQL first, then check `server\.env`. |
| `npm run db:seed:all` fails mid-way | Run the individual commands to see which step failed: `npm run db:seed:catalog`, then `npm run db:seed:employees`, then `npm run db:seed:service-staff`. Fix the error and re-run from that step. |
| `npx prisma migrate deploy` fails | Check the `DATABASE_URL` in `server\.env`. MySQL must be running. |
| Old staff still appear | The employees step wipes them **then** recreates the team. If `npm run db:seed:all` failed before the employees step, re-run it (your backup is safe). |
| Map still shows the old location | You're opening an outdated cached page. Press **Ctrl + F5**, or close and reopen the browser tab. |
| Page looks broken / styles missing | You may still be running old code. Stop the system, update files (Step A2), restart, and `Ctrl + F5`. |

---

## Checklist

```
[ ] MySQL running and server\.env correct
[ ] Database backed up (backup-souvari.sql)
[ ] New project files copied + npm install (root, server, client)
[ ] cd server && npx prisma generate
[ ] npx prisma migrate deploy
[ ] npm run db:seed:all     (real services, staff, schedules, assignments)
[ ] Admin → Settings → address/phone/email updated
[ ] Restart + Ctrl+F5, verify map + services + staff on the Contact page
```