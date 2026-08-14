# Full setup guide

A beginner-friendly, step-by-step walkthrough for getting jinxmrcl running from
scratch — including the parts most people get stuck on (installing `ffmpeg` and
getting it onto your `PATH`, creating the MySQL database, and setting up Discord
OAuth). If you're already comfortable with Node/MySQL/ffmpeg, the short version
is in the [README](README.md#getting-started).

## Table of contents

1. [Install Node.js](#1-install-nodejs)
2. [Install MySQL or MariaDB](#2-install-mysql-or-mariadb)
3. [Install ffmpeg](#3-install-ffmpeg)
4. [Get the code](#4-get-the-code)
5. [Configure the environment](#5-configure-the-environment)
6. [First run](#6-first-run)
7. [Make yourself the owner](#7-make-yourself-the-owner)
8. [Optional: Discord sign-in and presence](#8-optional-discord-sign-in-and-presence)
9. [Running in production](#9-running-in-production)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Install Node.js

You need **Node.js 20 or newer**.

**Windows / macOS** — download the LTS installer from
[nodejs.org](https://nodejs.org/) and run it. Accept the defaults.

**macOS (Homebrew)**
```bash
brew install node
```

**Linux (Debian/Ubuntu)**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Any OS (nvm, recommended if you'll juggle multiple Node versions)**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20
nvm use 20
```

Verify it worked:
```bash
node -v   # should print v20.x.x or newer
npm -v
```

## 2. Install MySQL or MariaDB

The app creates and migrates every table itself on first start — you only need
to give it an empty database and a user that can access it.

**Windows** — install [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
via the installer (pick "Server only" if you don't need the extra tools).

**macOS (Homebrew)**
```bash
brew install mariadb
brew services start mariadb
```

**Linux (Debian/Ubuntu)**
```bash
sudo apt-get install -y mariadb-server
sudo systemctl enable --now mariadb
```

Once it's running, create the database and a dedicated user (replace
`change-me` with a real password):

```bash
sudo mysql -u root
```
```sql
CREATE DATABASE jinxmrcl CHARACTER SET utf8mb4;
CREATE USER 'jinxmrcl'@'localhost' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON jinxmrcl.* TO 'jinxmrcl'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

(On Windows, run the equivalent SQL from the "MySQL Command Line Client" that
came with the installer, or via MySQL Workbench.)

You'll plug these values (`jinxmrcl` / `change-me` / `jinxmrcl`) into `.env` in
step 5.

## 3. Install ffmpeg

This is the step people most often get wrong — mainly because on Windows,
installing ffmpeg doesn't automatically put it on your `PATH`, and the app
will fail silently on video/audio uploads until it is.

**macOS (Homebrew)** — this is the easy path, `PATH` is handled for you:
```bash
brew install ffmpeg
```

**Linux (Debian/Ubuntu)**
```bash
sudo apt-get install -y ffmpeg
```

**Linux (Fedora)**
```bash
sudo dnf install -y ffmpeg
```

**Windows**
1. Download a build from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) — grab
   the "release full" `.zip` under **release builds**.
2. Extract it somewhere permanent, e.g. `C:\ffmpeg`. After extracting, you
   should have `C:\ffmpeg\bin\ffmpeg.exe`.
3. Add it to your `PATH`:
   - Press `Win`, search **"Edit the system environment variables"**, open it.
   - Click **Environment Variables**.
   - Under **System variables**, select `Path` → **Edit** → **New**.
   - Add `C:\ffmpeg\bin` (adjust if you extracted somewhere else).
   - Click OK on every dialog.
4. **Close and reopen** any terminal/PowerShell window you had open — `PATH`
   changes don't apply to already-running terminals.

**Verify it worked (any OS):**
```bash
ffmpeg -version
```
If you see a version number, you're done. If you get "command not found" /
"not recognized", ffmpeg isn't on your `PATH` yet — on Windows this is almost
always caused by step 4 above, or by not having reopened the terminal.

You do **not** need to configure anything about ffmpeg in `.env` — the app
just calls the `ffmpeg` command directly, so as long as it works in a plain
terminal, it'll work for the app too.

## 4. Get the code

**With git:**
```bash
git clone https://github.com/jinxmrcl/jinxmrcl.com.git
cd jinxmrcl.com
```

**Without git:** click **Code → Download ZIP** on the
[GitHub repo page](https://github.com/jinxmrcl/jinxmrcl.com), extract it, and
open a terminal in that folder.

Then install dependencies:
```bash
npm install
```

## 5. Configure the environment

Copy the example file:
```bash
cp .env.example .env      # Windows (PowerShell): copy .env.example .env
```

Open `.env` in any text editor and fill in at minimum:

| Variable | What to put |
|---|---|
| `SITE_URL` | `http://localhost:3003` while testing locally; your real domain (e.g. `https://files.example.com`) once deployed |
| `SITE_NAME` | Whatever you want shown in the header/title, e.g. `myhost` |
| `JINXMRCL_DB_HOST` | `127.0.0.1` if MySQL runs on the same machine |
| `JINXMRCL_DB_USER` | `jinxmrcl` (or whatever you created in step 2) |
| `JINXMRCL_DB_PASSWORD` | the password you set in step 2 |
| `JINXMRCL_DB_NAME` | `jinxmrcl` |

Everything else (`MAX_UPLOAD_BYTES`, `OWNER_USERNAME`, all the `DISCORD_*`
variables) has sensible defaults or can stay blank — see the comments in
[`.env.example`](.env.example) for details, and [step 8](#8-optional-discord-sign-in-and-presence)
if you want Discord sign-in.

## 6. First run

```bash
npm run dev
```

Open [http://localhost:3003](http://localhost:3003). If the homepage loads,
your database connection is working (the app creates all tables automatically
on this first request).

For a production-style run instead:
```bash
npm run build
npm start
```

## 7. Make yourself the owner

1. Go to `/register` and create an account.
2. Open `.env`, set `OWNER_USERNAME` to that exact username.
3. Restart the server (`Ctrl+C`, then `npm run dev` again).

Your account is now promoted to the `owner` role, which unlocks the staff
dashboard (users, reports, appeals, incidents). This check re-runs on every
startup, so it's fine to leave `OWNER_USERNAME` set permanently.

## 8. Optional: Discord sign-in and presence

Skip this section entirely if you don't need Discord login — the site works
fully without it.

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   → **New Application**.
2. **OAuth2** tab → add a redirect:
   `${SITE_URL}/api/auth/discord/callback` (e.g.
   `http://localhost:3003/api/auth/discord/callback`).
   Copy the **Client ID** and **Client Secret** into `DISCORD_CLIENT_ID` /
   `DISCORD_CLIENT_SECRET` in `.env`.
3. Generate a random encryption key for storing tokens at rest:
   ```bash
   openssl rand -hex 32
   ```
   Put the result in `DISCORD_TOKEN_KEY`.
4. *(Only if you want live Discord presence on profiles)*:
   - **Bot** tab → **Add Bot** → copy the token into `DISCORD_BOT_TOKEN`.
   - On the same page, enable **Presence Intent** and **Server Members
     Intent** under "Privileged Gateway Intents".
   - Invite the bot to your server (OAuth2 → URL Generator → scope `bot`,
     no special permissions needed) and set `DISCORD_GUILD_ID` to that
     server's ID (right-click the server in Discord → Copy Server ID;
     requires Developer Mode enabled in Discord's settings).
   - Run the presence bot as its own process:
     ```bash
     node --env-file=.env bot/discord-presence-bot.mjs
     ```

## 9. Running in production

Use a process manager so the app survives reboots/crashes. With
[pm2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
npm run build
pm2 start npm --name jinxmrcl -- start
pm2 start bot/discord-presence-bot.mjs --name jinxmrcl-presence   # optional
pm2 save
```

Put a reverse proxy (nginx, Caddy, Apache) in front for TLS — the app itself
listens on plain HTTP (port 3003 by default via `npm start`).

## 10. Troubleshooting

**"ffmpeg: command not found" / uploads of profile video/music fail**
ffmpeg isn't on your `PATH`. Re-check [step 3](#3-install-ffmpeg), and make
sure you opened a *new* terminal after editing `PATH` on Windows.

**"connect ECONNREFUSED 127.0.0.1:3306" on startup**
MySQL/MariaDB isn't running, or `JINXMRCL_DB_HOST`/`JINXMRCL_DB_PORT` in
`.env` don't match. Confirm the server is up (`sudo systemctl status mariadb`
on Linux, `brew services list` on macOS).

**"Access denied for user ... "**
`JINXMRCL_DB_USER`/`JINXMRCL_DB_PASSWORD` don't match what you created in
step 2, or the user wasn't granted privileges on the database — re-run the
`GRANT ALL PRIVILEGES ...` statement.

**Port 3003 already in use**
Something else is already listening on it. Either stop that process, or
change the port: it's hardcoded in `package.json`'s `dev`/`start` scripts
(`next dev -p 3003` / `next start -p 3003 ...`) — edit the `-p 3003` there to
a free port, then update `SITE_URL` in `.env` to match.

**Discord sign-in button does nothing / errors out**
`DISCORD_CLIENT_ID`/`DISCORD_CLIENT_SECRET` are blank or wrong, or the OAuth2
redirect URI configured on the Discord application doesn't exactly match
`${SITE_URL}/api/auth/discord/callback` (protocol, domain and path all have
to match exactly).

Still stuck? [Open an issue](https://github.com/jinxmrcl/jinxmrcl.com/issues).
