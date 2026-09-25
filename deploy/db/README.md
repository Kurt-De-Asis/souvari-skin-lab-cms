# Database snapshot sync (developer -> client laptop)

One-way, on-demand copy of the `iave_clinic` database. Your (developer) machine is
the master; the client laptop is always overwritten with the latest snapshot.

> PRIVACY: the snapshot contains real client data and is committed to the PUBLIC
> repo by explicit decision. Anyone can download it. Do not re-share the repo if
> that is unacceptable.

## Send a snapshot (developer machine — Linux/WSL)

```bash
./deploy/db/export.sh
```

This runs `mysqldump` on `iave_clinic`, writes `deploy/db/souvari-live.sql`,
commits it, and pushes to `master`.

## Push a snapshot to the live Railway MySQL (developer machine or Railway console)

Paste this into the Railway MySQL service **Console** (bash) to overwrite the live
`railway` database with `souvari-live.sql` from the repo:

```bash
bash deploy/db/apply-live.sh
```

Because the console has no repo clone, the script falls back to downloading the
snapshot from GitHub. If `deploy/db/souvari-live.sql` is already on disk (local run)
it is used as-is. Locally it targets `iave_clinic` by default; in the Railway
console it detects `MYSQL_ROOT_PASSWORD` and targets `railway`.

> The apply is a DROP + recreate + import: any records created in the live app
> since the last snapshot are lost. In a demo, re-apply only when you want the
> live DB to mirror the client snapshot exactly.

## Capture the live data back into the repo (safety net)

If records were added in the live app and you want to preserve them, dump them
back into the repo from the client laptop (has git push creds):

```bash
./deploy/db/export-live.sh
```

Paste the `MYSQL_PUBLIC_URL` from the MySQL service's Variables tab when prompted.
The service must be awake (enable **Always On** on Railway).

## Receive a snapshot (client laptop — Windows + native MySQL 8)

1. `git pull` the repo (or run the script, which pulls for you).
2. Double-click / run:

```bat
deploy\db\restore-client.bat
```

Steps performed:
1. `git pull` the latest `souvari-live.sql`
2. Locate `mysql.exe` and prompt for the MySQL root password
3. Verify the server is MySQL 8 (the dump uses `utf8mb4_0900_ai_ci`)
4. Drop + recreate `iave_clinic`
5. Import the dump
6. Baseline the three Prisma migrations as "already applied"
7. Verify counts vs the snapshot (81 appointments / 22 customers / 47 treatment
   records / 45 transactions / 33 users) and print PASS/CHECK. These numbers
   move with every snapshot — treat them as a sanity check, not a contract.

Afterwards, log in to the app with the real admin account and open one client
record to confirm.

## Model

- Master: developer machine. Snapshot is re-exported + pushed whenever the
  client laptop should match again.
- Client laptop: read-only for this workflow — changes made there are lost on
  the next restore. Do NOT enter new bookings on both machines.
- Live Railway DB mirrors the snapshot; apply it with `apply-live.sh` for demos.
- Requires MySQL 8.x on the client (collation `utf8mb4_0900_ai_ci`).