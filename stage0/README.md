# freeAB.app — Stage 0 (multiuser invite drill)

Practice the door with a small group before the real decentralized board.

**Roles**

| Role | Who | What they do |
| --- | --- | --- |
| Developer | You | First-time setup, create the **manager** invite, audit, reset pilot |
| Manager | 1 org person | Create **user** invites, revoke, post announcements |
| User | 2–3 supporters | Redeem invite, read board, leave |

No phone numbers or emails are collected. Users pick a display handle only.

## Run locally

Python 3.10+ (stdlib only — no pip packages):

```bash
cd freeab/stage0
python server.py
```

Or: `npm start` (runs the same Python server).

Open **http://localhost:3847** on this machine. Others on your LAN can use `http://YOUR-LAN-IP:3847`.

## Pilot script (~15 minutes)

1. **Developer** opens the site → Developer → choose a passphrase (8+ chars).
2. Developer clicks **Create manager invite** → copy the code → send it to your manager (text/Signal/in person).
3. **Manager** opens the same URL (or your tunnel URL) → Manager → paste invite → choose a handle.
4. Manager creates **user invites** (one per person). Optional “vouch label” is a short note like “met at town hall”, not a phone number.
5. **Users** join with their codes, read the board.
6. Manager **publishes** a practice announcement.
7. Manager **revokes** one user on purpose — confirm they lose access.
8. A user **leaves** on purpose.

If the drill works, organizers will revoke. If they will not, Stage 1 will not save you.

## Share beyond localhost

Point friends at your machine with a tunnel, for example Cloudflare Tunnel or ngrok:

```bash
# example once cloudflared is installed
cloudflared tunnel --url http://localhost:3847
```

Or deploy later behind **freeAB.app**. Until then, any HTTPS URL that reaches this server works.

## Reset

In the developer UI: **Reset pilot** (keeps your passphrase).

Or from the shell:

```bash
npm run reset
npm start
```

## What this is not

Stage 0 is **not** Nostr yet. Shared state lives in `data/store.json` on the machine running the server. Stage 1 adds device-held keys and the notice-board protocol.
