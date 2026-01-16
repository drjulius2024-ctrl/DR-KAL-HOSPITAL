# Deployment Guide: Dr. Kal's Virtual Hospital

This guide explains how to deploy your application to **Railway** (recommended) or similar platforms that support persistent Node.js servers.

> **Why Railway?**
> Your app uses **Socket.IO** (WebSockets) and a **Custom Server** (`server.js`). Standard "Serverless" hosting (like Netlify or Vercel) **will not work** because they shut down connections immediately. You need a platform that keeps your server running 24/7.

---

## 🚀 1. Preparing the Database (SQLite → PostgreSQL)

Your local app uses **SQLite** (`dev.db`). This file cannot be used in production because it would be deleted every time you redeploy. You must switch to **PostgreSQL**.

### Step A: Update `prisma/schema.prisma`
**Important:** Do this ONLY when you are ready to deploy or want to switch to Postgres. To keep using SQLite locally, you can revert this change or keep two versions.

In `prisma/schema.prisma`:

Change the `datasource` block from:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

To:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step B: Generate the New Client
After changing the provider, you must run this command *locally* if you want to test, or let the build server do it (which it will automatically).
```bash
npx prisma generate
```

---

## 🚂 2. Deploying to Railway

1.  **Create an Account**: Go to [railway.app](https://railway.app/) and sign up (GitHub login recommended).
2.  **New Project**: Click **"New Project"** -> **"Deploy from GitHub repo"**. select your repository.
3.  **Add Database**:
    *   In your project dashboard, click **"New"** -> **"Database"** -> **"PostgreSQL"**.
    *   Railway will add a Postgres service.
4.  **Connect App to Database**:
    *   Click on your **Application** service (the GitHub repo one).
    *   Go to **"Variables"** tab.
    *   Click **"New Variable"**.
    *   Name: `DATABASE_URL`.
    *   Value: Reference the Postgres variable. Type `${{Postgres.DATABASE_URL}}` (Railway often provides a dropdown/autofill for this).
5.  **Set Other Environment Variables**:
    Add these variables in the **Variables** tab:
    *   `NEXTAUTH_URL`: Your Railway production URL (e.g., `https://dr-kals-hospital.up.railway.app`).
    *   `NEXTAUTH_SECRET`: A long random string (you can generate one with `openssl rand -base64 32`).
    *   `EMAIL_USER` / `EMAIL_PASS`: Your email credentials.
    *   `PORT`: `3000` (Optional, Railway sets this automatically usually, but good to ensure).

### Deployment Script
Railway automatically detects `package.json`.
*   **Build Command**: `npm run build`
*   **Start Command**: `npm start` (We updated this to run `node server.js` properly).

---

## 🛠 Keeping Local Development (SQLite)

To keep "local memory" (SQLite) while having production ready:

1.  **Do not commit** the `provider = "postgresql"` change if you want to keep working simply locally.
2.  **Recommended Workflow**:
    *   Create a branch `production`.
    *   In `production` branch, change `schema.prisma` to use `postgresql`.
    *   Keep `main` branch using `sqlite` for easy local dev.
    *   When you want to deploy, merge `main` into `production` and push `production`.

**Alternatively**, if you want to use Postgres locally too (Best Practice):
1.  Install PostgreSQL locally.
2.  Create a local database.
3.  Set `DATABASE_URL="postgresql://user:password@localhost:5432/drkalsdb"` in your `.env`.
4.  Switch `schema.prisma` to `postgresql` permanently. This aligns your Dev and Prod environments.
