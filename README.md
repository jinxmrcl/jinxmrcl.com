<div align="center">

# jinxmrcl

**A self-hosted, Discord-native file host** — image/video/audio hosting with per-user
profiles, custom embeds, stylish QR sharing, and a full staff/moderation dashboard.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL%20%2F%20MariaDB-8%2B-4479A1?logo=mysql&logoColor=white)
[![GitHub stars](https://img.shields.io/github/stars/jinxmrcl/jinxmrcl.com?style=flat&color=yellow)](https://github.com/jinxmrcl/jinxmrcl.com/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/jinxmrcl/jinxmrcl.com)](https://github.com/jinxmrcl/jinxmrcl.com/issues)
[![Lines of Code](https://tokei.rs/b1/github/jinxmrcl/jinxmrcl.com)](https://github.com/jinxmrcl/jinxmrcl.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)

</div>

---

## Features

- **File hosting** — drag-and-drop or URL-based upload for images, video and audio, each
  with its own short link, ShareX config export, and an API key for scripted uploads.
- **Stylish QR sharing** — every file page can generate a styled, downloadable QR code
  for sharing to another device.
- **Custom embeds** — per-user Discord embed title/description/color templates for
  shared links.
- **Per-user profiles** — public profile pages (optionally on their own subdomain) with
  avatar, background video/music, and live Discord presence.
- **Discord OAuth** — optional sign-in with Discord, account linking, and a standalone
  presence bot.
- **Moderation tooling** — roles (owner/admin/staff/user), bans with appeals, file
  reports, and a public status page with incident history.
- **i18n** — English and German out of the box.

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · MySQL/MariaDB via
`mysql2` · `discord.js` for the presence bot.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- A MySQL or MariaDB server (the app creates and migrates all tables itself on first
  start — just point it at an empty database)
- [`ffmpeg`](https://ffmpeg.org/) on your `PATH` (used to transcode profile video/audio)
- *(optional)* A [Discord application](https://discord.com/developers/applications) if
  you want Discord sign-in / presence

### Installation

```bash
git clone https://github.com/jinxmrcl/jinxmrcl.com.git
cd jinxmrcl.com
npm install

cp .env.example .env
# now edit .env — at minimum set SITE_URL and the JINXMRCL_DB_* values
```

See [`.env.example`](.env.example) for every variable and what it does. Discord-related
variables can be left blank; the site works fine without them, the Discord sign-in
button just won't do anything.

### Running

```bash
npm run dev      # local development, http://localhost:3003
npm run build    # production build
npm start        # serve the production build
```

The first account you register becomes a normal user. To make it an admin: register it,
then set `OWNER_USERNAME` in `.env` to that username and restart the server — it gets
auto-promoted to the `owner` role on the next startup (this check re-runs on every
restart, so it's safe to leave the variable set permanently).

### Discord presence bot (optional)

`bot/discord-presence-bot.mjs` is a separate, long-running process (it holds a Discord
Gateway/WebSocket connection, which doesn't fit inside a Next.js request handler). Only
needed if you want live Discord status shown on profiles.

```bash
node --env-file=.env bot/discord-presence-bot.mjs
```

Run it under a process manager (systemd, pm2, ...) in production.

## Project structure

```
app/          Next.js App Router — pages, API routes, dashboard
lib/          Database layer, auth, Discord OAuth, uploads, i18n
components/   Shared UI (shadcn/ui-based)
bot/          Standalone Discord presence bot
public/       Static assets
```

## Custom profile subdomains

If you want `<username>.yourdomain.com` to resolve to a user's public profile (as
`middleware.ts` supports), point a wildcard DNS record (`*.yourdomain.com`) and a
wildcard TLS certificate at your server, and set `SITE_URL` to your root domain.
This is entirely optional — profiles are always reachable at `/u/<username>` regardless.

## Contributing

Issues and PRs are welcome. Please don't include real credentials, user data, or
anything from your own `.env` in commits or issue reports.

## License

[MIT](LICENSE)
