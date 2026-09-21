# Setup Tutorial — Running the System on a New Computer or Laptop

This guide walks you through getting the **IAVE Beauty & Co. / Souvari Skin Lab Clinic Management System** running on a computer or laptop from scratch. It requires no prior developer experience — just follow the steps in order.

---

## 1. What You Need (Requirements)

| Requirement | Minimum Version | Notes |
|-------------|-----------------|-------|
| Node.js | **20 or newer** | Used to run the frontend and backend |
| npm | comes with Node.js | Node's package manager |
| MySQL | **8.0** | The database that stores all data |
| Git (optional) | — | Only needed if cloning from GitHub |

> **Tip:** You can check your versions in a terminal with:
> ```bash
> node --version
> npm --version
> mysql --version
> ```

---

## 2. Install Node.js

### Option A — Simple installer (recommended for beginners)
1. Go to https://nodejs.org
2. Download the **LTS** version (e.g. 22.x).
3. Run the installer and accept all default settings.
4. After install, open a new terminal and run:
   ```bash
   node --version
   npm --version
   ```
   Both should print a version number (no errors).

### Option B — Using nvm (manages multiple versions)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20
nvm use 20
node --version
```

---

## 3. Install MySQL (the Database)

You need a running MySQL 8.0 server. Pick **one** option.

### Option A — MySQL Installer
- **Windows:** https://dev.mysql.com/downloads/installer/ — install "MySQL Server", choose the default port `3306`, and set a password you will remember.
- **macOS:** https://dev.mysql.com/downloads/mysql/ — download and run the dmg installer.
- **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt update
  sudo apt install mysql-server
  sudo systemctl enable --now mysql
  ```

### Option B — Docker (easiest, no separate MySQL install)
If you have Docker Desktop installed:
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
Copy the whole `capstone-clinic-management-system` folder to the new computer. Make sure the following are included:
- `package.json`
- `server/` (including the hidden `server/.env` file and `server/prisma/`)
- `client/`

### Option B — Clone from Git
```bash
git clone <your-repository-url>
cd capstone-clinic-management-system
```

---

## 5. Install Dependencies

Open a **terminal/command prompt inside the project folder** and run:

```bash
# 1) Install root dependencies (runs both server and client together later)
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

> **If you get permission errors on macOS/Linux:** try `sudo npm install` for the system-level installs, or fix npm permissions first.

---

## 6. Configure the Environment File

The backend needs a `.env` file with database credentials and secret keys.

1. Inside the `server` folder, create the `.env` file. If `.env.example` exists at the project root, copy it:
   ```bash
   cp ../.env.example server/.env
   ```
2. Open `server/.env` and update the values:

   ```env
   # Database — change password and host if your MySQL is different
   DATABASE_URL="mysql://root:password@localhost:3306/iave_clinic"

   # JWT secrets — use your own random text
   JWT_ACCESS_SECRET="change-this-to-a-random-string"
   JWT_REFRESH_SECRET="change-this-to-another-random-string"
   JWT_ACCESS_EXPIRES_IN="15m"
   JWT_REFRESH_EXPIRES_IN="7d"
   NODE_ENV="development"
   PORT=3000

   FRONTEND_URL="http://localhost:5173"
   BACKEND_URL="http://localhost:3000"

   # Leave AI/SMS empty — the app uses safe fallbacks
   AI_API_KEY=""
   SMS_PROVIDER="mock"
   ```

   - If your MySQL password is different, update `password` in `DATABASE_URL`.
   - If MySQL runs on another port, change `3306`.

> **Security note:** In production you must generate strong random secrets. Use `openssl rand -hex 32`.

---

## 7. Create the Database Tables (Migrations)

Now tell the app to create all its tables inside your MySQL. Run these from the `server` folder:

```bash
cd server

# Generate the Prisma client (the tool that talks to MySQL)
npx prisma generate

# Create/update the database tables
npx prisma migrate dev
```

`migrate dev` may ask if it should **reset** the database — answer `n` (no) the first time.

If `migrate dev` complains about applying migrations to an already-set-up database, use:
```bash
npx prisma migrate deploy
npx prisma db push
```

---

## 8. Add Sample Data (Optional but Recommended)

The app ships with a demo dataset (accounts, services, staff, customers):

```bash
cd server
npx prisma db seed
```

> On a brand-new setup you can also run `npx prisma migrate reset` which recreates the tables and auto-runs the seed. **This erases all data**, so only do it on a fresh machine.

---

## 9. Start the System

From the **project root** folder run:

```bash
npm run dev
```

This starts both at the same time:
- **Frontend (website):** http://localhost:5173
- **Backend (API):** http://localhost:3000/api/health

> The first start can take a few seconds while Node compiles. You will see a "Database connected successfully" message when the backend is up.

---

## 10. Log In with the Demo Accounts

Open http://localhost:5173 in your browser and sign in.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@iave.local` | `password123` |
| Staff | `maria.santos@iave.local` | `password123` |
| Customer | `juan.delacruz@email.com` | `password123` |

- **Admin** → manage everything: Calendar, customers, staff, services, inventory, reports.
- **Staff** → Calendar, appointments, and their own schedule.
- **Customer** → book appointments, view transactions, membership, chat.

---

## 11. Using the Calendar Notes & Allergies Feature

After logging in as **Admin** (or **Staff**):

1. Go to **Bookings → Calendar**.
2. Click an appointment to open the details.
3. Click **"View Full Profile & Notes"**.
4. Open the **Notes** or **Allergies** tab, type your note/allergy, and click **Save Note** / **Add Allergy Alert**.

The note/allergy is saved to the customer's clinical records and appears in their Notes / Allergies / Records tabs.

---

## 12. Stopping and Restarting

- **Stop:** press `Ctrl + C` in the terminal running `npm run dev`.
- **Restart:** run `npm run dev` again (no need to redo any setup).
- **Start a fresh database:** `cd server && npx prisma migrate reset` then `npm run dev`.

---

## 13. Troubleshooting

| Problem | Fix |
|---------|-----|
| `Access denied for user 'root'` | Check the password in `DATABASE_URL` in `server/.env`. |
| `Can't connect to MySQL server` / `ECONNREFUSED` | MySQL isn't running, or `PORT` in `DATABASE_URL` is wrong. Start MySQL / Docker first. Confirm port `3306`. |
| `Port 3000 already in use` | Change `PORT` to `3001` in `server/.env` — or close the other program using port 3000. |
| `Port 5173 already in use` | Edit `client/vite.config.ts` → `server.port` to e.g. `5174`. |
| `npx prisma migrate dev` fails | Try `npx prisma migrate deploy`, then `npx prisma db push`. |
| Missing demo accounts | Did you run `npx prisma db seed`? |
| `ERR_OSSL_EVP_UNSUPPORTED` (OpenSSL error) | Your Node.js is very old. Install Node 20 or newer. |
| CORS error in the browser console | Make sure `FRONTEND_URL` in `server/.env` matches the URL you open (e.g. `http://localhost:5173`). |

---

## 14. Quick Checklist for a New Laptop

```
[ ] Node.js 20+ installed            (node --version)
[ ] npm installed                    (npm --version)
[ ] MySQL 8.0 running                (or Docker: docker compose up -d)
[ ] Project folder copied/cloned
[ ] npm install  (root, server, client)
[ ] server/.env created and filled in
[ ] npx prisma generate
[ ] npx prisma migrate dev
[ ] npx prisma db seed
[ ] npm run dev   → open http://localhost:5173
```