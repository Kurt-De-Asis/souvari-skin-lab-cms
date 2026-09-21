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

## Step 4 — Double-click the two files

1. Double-click **`setup.bat`**
   - It checks Node.js, asks for your MySQL password once, and does everything
     else automatically (installs dependencies, creates the database tables,
     and adds the sample data). Takes about 5 minutes the first time.
   - When you see **SETUP COMPLETE**, you're done.
2. Double-click **`start.bat`**
   - The website opens at **http://localhost:5173**.

> From now on, every day you just double-click **`start.bat`** — no setup again.

---

## Demo accounts (password for all: `password123`)

| Role | Email |
|------|-------|
| Admin | `admin@iave.local` |
| Staff | `maria.santos@iave.local` |
| Customer | `juan.delacruz@email.com` |

If something goes wrong during `setup.bat`, just re-run it once. Troubleshooting
details are in **setup-tutorial.md** (Section 13).