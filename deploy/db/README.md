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
- Requires MySQL 8.x on the client (collation `utf8mb4_0900_ai_ci`).