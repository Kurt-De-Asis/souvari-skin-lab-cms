# Quick Setup — Souvari Skin Lab (4 Steps, No Docker Needed)

This is the fast way to get the system running on a Windows PC. For any tricky
situations, see the full guide in **setup-tutorial.md**.

---

## Step 1 — Install Node.js

Go to **https://nodejs.org** → download the **LTS** version → run the installer
(accept all defaults).

## Step 2 — Install MySQL

Go to **https://dev.mysql.com/downloads/installer/** → install **MySQL Server**.
Keep the default port **3306** and **set a password you'll remember**.
(Use letters and numbers only, e.g. `clinic2024`.)

> No Docker needed. If your PC already has Docker, you don't have to use it.

## Step 3 — Get the project folder

Copy the whole project folder to the PC (e.g. from USB or Google Drive).
Double-check it contains `setup.bat` and `start.bat`.

> **Fastest option:** if the owner also gave you **`souvari_full.sql`** (a snapshot
> of the owner's database), `setup.bat` will automatically import it instead of
> slowly seeding data — same result, but in under a minute.

## Step 4 — Double-click the two files

1. Double-click **`setup.bat`**
   - It checks Node.js, asks for your MySQL password once, and does everything
     else automatically: installs dependencies, creates the database tables, and
     loads the data.
   - **If `souvari_full.sql` is present** → it imports the owner's database
     directly (fast).
   - **If not** → it seeds the full sample + real data (takes ~5 minutes).
   - When you see **SETUP COMPLETE**, you're done.
2. Double-click **`start.bat`**
   - The website opens at **http://localhost:5173**.

> From now on, every day you just double-click **`start.bat`** — no setup again.

---

## Demo accounts (password for all: `password123`)

| Role | Email |
|------|-------|
| Admin | `souvariskinlab@gmail.com` |
| Staff | `gianheartdaygon24@gmail.com` |
| Customer | `juan.delacruz@email.com` |

If something goes wrong during `setup.bat`, just re-run it once. Troubleshooting
details are in **setup-tutorial.md** (Section 13).

---

## Updating a machine that's already running

If the system is **already installed and running** on a computer and you need to
make it match the owner's database:

1. Copy the new project folder over the old one.
2. If the owner gave you **`souvari_full.sql`**, double-click **`import-database.bat`**
   (replaces the whole database — backs up first is recommended).
   Otherwise double-click **`update-data.bat`** (keeps customers, refreshes
   services/staff).
3. Restart with **`start.bat`** and press **Ctrl+F5** in the browser.

See **UPGRADE-GUIDE.md** for the full step-by-step (including backing up first).