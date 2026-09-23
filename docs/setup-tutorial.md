# Setup Guide — Souvari Skin Lab Clinic Management System

This guide walks you through getting the **Souvari Skin Lab Clinic Management System** running on a computer or laptop from scratch. No prior developer experience is needed — just follow the steps in order. It should take about **10–15 minutes**.

---

## 1. What You Need (Requirements)

| Requirement | Minimum Version | Notes |
|-------------|-----------------|-------|
| Node.js | **20 or newer** | Runs both the app and the database tools. Version 22 LTS is recommended. |
| npm | comes with Node.js | Node's package manager (installed automatically with Node). |
| MySQL | **8.0** | The database that stores all clinic data. We start it with Docker (easiest). |
| Git | optional | Only needed if you clone from GitHub instead of copying the folder. |
| Docker Desktop | optional | Only needed if you use the Docker route for MySQL (recommended). |

> **Tip:** You can check your versions in a terminal with:
> ```bash
> node --version
> npm --version
> ```

---

## 2. Install Node.js

**Option A — Simple installer (recommended for beginners)**
1. Go to https://nodejs.org
2. Download the **LTS** version (e.g. 22.x).
3. Run the installer and accept all default settings.
4. Open a **new** terminal and run:
   ```bash
   node --version
   npm --version
   ```
   Both should print a version number (no errors).

**Option B — Using nvm (for managing multiple versions)**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20
nvm use 20
node --version
```

---

## 3. Install MySQL (the Database)

You need a running MySQL 8.0 server. Pick **one** option.

### Option A — Native MySQL Installer (recommended — no Docker needed)
Works on any PC without special virtualization support.
- **Windows:** go to https://dev.mysql.com/downloads/installer/ and download the **MySQL Installer**.
  1. During setup, choose "MySQL Server".
  2. Keep the default port `3306`.
  3. **Set a password you will remember** (you'll type it into `server/.env` later).
- **macOS:** https://dev.mysql.com/downloads/mysql/ — download and run the dmg installer.
- **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt update
  sudo apt install mysql-server
  sudo systemctl enable --now mysql
  ```

> In `server/.env` (Step 6), the line `DATABASE_URL="mysql://root:password@localhost:3306/iave_clinic"` must use the password you set here.

### Option B — Docker (only if Docker Desktop already works)
Docker is only needed to run MySQL inside a virtual machine, and it **requires Windows virtualization support (VT-x/AMD-V + WSL2 or Hyper-V)**. On many office PCs this is not available. If you hit "Windows virtualization support isn't detected", use **Option A** instead, or see the Troubleshooting section.

1. Install **Docker Desktop** from https://www.docker.com/products/docker-desktop/ and open it.
2. The project ships with a `docker-compose.yml` that sets everything up. From the project folder run:
   ```bash
   docker compose up -d
   ```
   This starts MySQL with:
   - Database name: `iave_clinic`
   - Username: `root`
   - Password: `password`
   - Port: `3306`

> Keep the `docker-compose.yml` file that came with the project — it already contains these settings.

---

## 4. Get the Project Files

You have two choices:

### Option A — Copy the project folder (e.g., from a USB drive / Google Drive)
Copy the whole `capstone-clinic-management-system` folder to the new computer. It must include the **`server`**, **`client`**, and **`docs`** folders plus the top-level files (`package.json`, `docker-compose.yml`, `.env.example`).

### Option B — Clone from GitHub
```bash
git clone https://github.com/Kurt-De-Asis/souvari-skin-lab-cms.git
cd souvari-skin-lab-cms
```

> From here on, all commands should be run from **inside the project folder**.

---

## 5. Install Dependencies

Open a **terminal / command prompt inside the project folder** and run:

```bash
# 1) Install root dependencies
npm install

# 2) Install server dependencies
cd server
npm install
cd ..

# 3) Install client dependencies
cd client
npm install
cd ..
```

> **If you get permission errors on macOS/Linux:** try `sudo npm install`, or fix npm permissions first.

---

## 6. Configure the Environment File

The backend needs a `.env` file with database credentials and secret keys.

1. From the **project root**, copy the template into the server folder:
   ```bash
   cp .env.example server/.env
   ```
2. Open `server/.env` in a text editor and update the values:

   ```env
   # Database — change password if your MySQL is different
   DATABASE_URL="mysql://root:password@localhost:3306/iave_clinic"

   # JWT secrets — replace with your own random text
   JWT_ACCESS_SECRET="change-this-to-a-random-string"
   JWT_REFRESH_SECRET="change-this-to-another-random-string"
   JWT_ACCESS_EXPIRES_IN="15m"
   JWT_REFRESH_EXPIRES_IN="7d"
   NODE_ENV="development"
   PORT=3000

   FRONTEND_URL="http://localhost:5173"
   BACKEND_URL="http://localhost:3000"

   # Leave AI/SMS/Email settings empty — the app uses safe fallbacks
   AI_API_KEY=""
   SMS_PROVIDER="mock"
   ```

   - If your MySQL password is different, update the `password` in `DATABASE_URL`.
   - If MySQL runs on another port, change `3306`.

> **Security note:** For a real deployment, generate strong random secrets with `openssl rand -hex 32`.

---

## 7. Create the Database Tables (Migrations)

Tell the app to create all its tables inside your MySQL. Run these from the `server` folder:

```bash
cd server

# Generate the Prisma client (the tool that talks to MySQL)
npx prisma generate

# Create/update the database tables
npx prisma migrate dev
```

- The first run may ask if it should **reset** the database — answer `n` (no).
- If `migrate dev` complains about an already-set-up database, use:
  ```bash
  npx prisma migrate deploy
  npx prisma db push
  ```

---

## 8. Add Sample Data (Recommended)

The app ships with demo data (accounts, services, staff, customers, products):

```bash
cd server
npx prisma db seed
```

To load the **full Souvari Skin Lab data** — the complete service catalog,
membership plans, loyalty rules, the real staff with their schedules, and the
staff↔service assignments — run the single command:

```bash
npm run db:seed:all
```

> **Note:** `setup.bat` (the one-click installer) runs this full chain for you
> automatically on a fresh install. If the system is **already running** and you
> just want to update it with the real data without losing customers, see
> **UPGRADE-GUIDE.md** (or double-click `update-data.bat`).

> On a brand-new setup you may also run `npx prisma migrate reset`, which recreates the tables and auto-runs the seed. **This erases all data**, so only do it on a fresh machine.

---

## 9. Start the System

From the **project root** folder run:

```bash
npm run dev
```

This starts both at the same time:
- **Frontend (website):** http://localhost:5173
- **Backend (API):** http://localhost:3000/api/health

> The first start can take a few seconds while Node compiles. You should see a **"Database connected successfully"** message when the backend is up.

---

## 10. Log In with the Demo Accounts

Open http://localhost:5173 in your browser and sign in.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@iave.local` | `password123` |
| Staff | `maria.santos@iave.local` | `password123` |
| Customer | `juan.delacruz@email.com` | `password123` |

- **Admin** → manage everything: Calendar, customers, staff, services, inventory, memberships, reports.
- **Staff** → Calendar, appointments, and their own schedule.
- **Customer** → book appointments, view transactions, membership, chat.

---

## 11. Optional: Automatic "Overdue Membership" Enforcement

The system can automatically mark partially-paid memberships as **failed** once their down-payment due date passes. The app already checks this in the background; the SQL below adds an extra hourly database-level check that runs even when the app is off.

From the `server` folder run:

```bash
cd server/prisma
mysql -u root -p < overdue.sql
```

(Enter the password you set for MySQL root when prompted.)

---

## 12. Stopping and Restarting

- **Stop:** press `Ctrl + C` in the terminal running `npm run dev`.
- **Restart:** run `npm run dev` again (no need to redo any setup).
- **Fresh database:** `cd server && npx prisma migrate reset`, then from the root run `npm run dev`.

---

## 13. Troubleshooting

| Problem | Fix |
|---------|-----|
| `Access denied for user 'root'` | Check the password in `DATABASE_URL` in `server/.env`. |
| `Can't connect to MySQL` / `ECONNREFUSED` | MySQL isn't running (start it / run `docker compose up -d` first), or the port in `DATABASE_URL` is wrong. |
| Docker Desktop: *"cannot start because Windows virtualization support isn't detected"* | Docker needs CPU virtualization, which is off on this PC. Either (a) install MySQL natively instead — see Section 3, **Option A** — or (b) fix virtualization: 1) Enable **VT-x/AMD-V** in your PC's BIOS/UEFI (check: Task Manager → Performance → CPU → "Virtualization: Enabled"); 2) enable Windows features "Virtual Machine Platform" + "Windows Hypervisor Platform" (Control Panel → Programs → Turn Windows features on or off); 3) install WSL 2: run `wsl --install` in an admin terminal. |
| `Port 3000 already in use` | Change `PORT` to `3001` in `server/.env` and `BACKEND_URL` to `http://localhost:3001`. |
| `Port 5173 already in use` | Edit `client/vite.config.ts` → `server.port` to e.g. `5174`. |
| `npx prisma migrate dev` fails | Try `npx prisma migrate deploy`, then `npx prisma db push`. |
| Missing demo accounts | Did you run `npx prisma db seed`? |
| `ERR_OSSL_EVP_UNSUPPORTED` (OpenSSL error) | Your Node.js is too old. Install Node 20 or newer. |
| CORS error in browser console | Make sure `FRONTEND_URL` in `server/.env` matches the URL you open (e.g. `http://localhost:5173`). |

---

## 14. Quick Checklist

```
[ ] Node.js 20+ installed            (node --version)
[ ] npm installed                    (npm --version)
[ ] MySQL 8.0 running                (native install, or Docker: docker compose up -d)
[ ] Project folder copied/cloned
[ ] npm install  (root, server, client)
[ ] server/.env created and filled in
[ ] npx prisma generate
[ ] npx prisma migrate dev
[ ] npx prisma db seed
[ ] npm run dev   → open http://localhost:5173
```