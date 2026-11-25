#!/usr/bin/env python3
"""freeAB.app Stage 0 — multiuser invite / revoke / practice board (stdlib only)."""

from __future__ import annotations

import hashlib
import json
import os
import secrets
import threading
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
DATA_DIR = ROOT / "data"
STORE_PATH = DATA_DIR / "store.json"
PORT = int(os.environ.get("PORT", "3847"))

LOCK = threading.Lock()


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(6)}"


def invite_code(groups: int = 3) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    parts = []
    for _ in range(groups):
        parts.append("".join(secrets.choice(alphabet) for _ in range(4)))
    return "-".join(parts)


def hash_pass(password: str, salt: str) -> str:
    dk = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt.encode("utf-8"),
        n=2**14,
        r=8,
        p=1,
        dklen=32,
    )
    return dk.hex()


def empty_store() -> dict:
    return {
        "setupComplete": False,
        "developerPassSalt": None,
        "developerPassHash": None,
        "sessions": {},
        "invites": {},
        "members": {},
        "posts": [],
        "events": [],
    }


def load_store() -> dict:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not STORE_PATH.exists():
        store = empty_store()
        save_store(store)
        return store
    return json.loads(STORE_PATH.read_text(encoding="utf-8"))


def save_store(store: dict) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    tmp = STORE_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(store, indent=2), encoding="utf-8")
    tmp.replace(STORE_PATH)


def log_event(store: dict, typ: str, detail: dict) -> None:
    store["events"].insert(
        0, {"id": new_id("evt"), "at": utcnow(), "type": typ, "detail": detail}
    )
    store["events"] = store["events"][:200]


def public_member(m: dict) -> dict:
    return {
        "id": m["id"],
        "handle": m["handle"],
        "role": m["role"],
        "status": m["status"],
        "board": m.get("board"),
        "invitedBy": m.get("invitedBy"),
        "createdAt": m.get("createdAt"),
        "revokedAt": m.get("revokedAt"),
    }


def create_session(store: dict, role: str, member_id: str | None) -> str:
    token = secrets.token_hex(24)
    store["sessions"][token] = {
        "role": role,
        "memberId": member_id,
        "createdAt": utcnow(),
        "expiresAt": None,
    }
    return token


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        print("%s - %s" % (self.address_string(), fmt % args))

    def _send_json(self, status: int, data: dict) -> None:
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

    def _auth(self, store: dict):
        header = self.headers.get("Authorization") or ""
        if not header.startswith("Bearer "):
            return None
        token = header[7:].strip()
        session = store["sessions"].get(token)
        if not session:
            return None
        return token, session

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            return self._api_get(parsed.path.rstrip("/") or "/")
        # static
        if parsed.path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if not parsed.path.startswith("/api/"):
            self.send_error(405)
            return
        return self._api_post(parsed.path.rstrip("/") or "/")

    def _api_get(self, route: str) -> None:
        with LOCK:
            store = load_store()
            if route == "/api/health":
                return self._send_json(
                    200,
                    {
                        "ok": True,
                        "product": "freeAB.app",
                        "stage": 0,
                        "setupComplete": store["setupComplete"],
                    },
                )
            if route == "/api/status":
                return self._send_json(
                    200,
                    {
                        "setupComplete": store["setupComplete"],
                        "stage": 0,
                        "product": "freeAB.app",
                        "counts": {
                            "activeMembers": sum(
                                1
                                for m in store["members"].values()
                                if m["status"] == "active"
                            ),
                            "openInvites": sum(
                                1
                                for i in store["invites"].values()
                                if i["status"] == "open"
                            ),
                            "posts": len(store["posts"]),
                        },
                    },
                )

            auth = self._auth(store)
            if route == "/api/me":
                if not auth:
                    return self._send_json(401, {"error": "Sign in required."})
                _, session = auth
                member = (
                    store["members"].get(session["memberId"])
                    if session.get("memberId")
                    else None
                )
                return self._send_json(
                    200,
                    {
                        "role": session["role"],
                        "member": public_member(member) if member else None,
                        "setupComplete": store["setupComplete"],
                    },
                )

            if not auth:
                return self._send_json(401, {"error": "Sign in required."})
            _, session = auth

            if route == "/api/invites":
                if session["role"] not in ("manager", "developer"):
                    return self._send_json(403, {"error": "Manager or developer only."})
                invites = sorted(
                    [
                        {
                            "code": i["code"],
                            "role": i["role"],
                            "board": i["board"],
                            "status": i["status"],
                            "vouchLabel": i.get("vouchLabel"),
                            "createdAt": i["createdAt"],
                            "usedAt": i.get("usedAt"),
                        }
                        for i in store["invites"].values()
                    ],
                    key=lambda x: x["createdAt"],
                    reverse=True,
                )
                return self._send_json(200, {"invites": invites})

            if route == "/api/members":
                if session["role"] not in ("manager", "developer"):
                    return self._send_json(403, {"error": "Manager or developer only."})
                members = sorted(
                    [public_member(m) for m in store["members"].values()],
                    key=lambda x: x["createdAt"] or "",
                    reverse=True,
                )
                return self._send_json(200, {"members": members})

            if route == "/api/posts":
                if session["role"] == "user":
                    member = store["members"].get(session.get("memberId"))
                    if not member or member["status"] != "active":
                        return self._send_json(403, {"error": "Access revoked or left."})
                posts = sorted(
                    store["posts"], key=lambda x: x["createdAt"], reverse=True
                )
                return self._send_json(200, {"posts": posts})

            if route == "/api/events":
                if session["role"] not in ("manager", "developer"):
                    return self._send_json(403, {"error": "Not allowed."})
                return self._send_json(200, {"events": store["events"][:50]})

            return self._send_json(404, {"error": "Unknown API route."})

    def _api_post(self, route: str) -> None:
        try:
            body = self._read_json()
        except json.JSONDecodeError:
            return self._send_json(400, {"error": "Invalid JSON"})

        with LOCK:
            store = load_store()

            if route == "/api/setup":
                if store["setupComplete"]:
                    return self._send_json(400, {"error": "Pilot already set up."})
                password = str(body.get("passphrase") or "").strip()
                if len(password) < 8:
                    return self._send_json(
                        400, {"error": "Use a passphrase of at least 8 characters."}
                    )
                salt = secrets.token_hex(16)
                store["developerPassSalt"] = salt
                store["developerPassHash"] = hash_pass(password, salt)
                store["setupComplete"] = True
                log_event(store, "setup", {"by": "developer"})
                token = create_session(store, "developer", None)
                save_store(store)
                return self._send_json(
                    200,
                    {
                        "token": token,
                        "role": "developer",
                        "message": "Pilot ready. Create a manager invite next.",
                    },
                )

            if route == "/api/dev/login":
                if not store["setupComplete"]:
                    return self._send_json(400, {"error": "Run setup first."})
                password = str(body.get("passphrase") or "")
                ok = (
                    hash_pass(password, store["developerPassSalt"])
                    == store["developerPassHash"]
                )
                if not ok:
                    return self._send_json(401, {"error": "Wrong passphrase."})
                token = create_session(store, "developer", None)
                save_store(store)
                return self._send_json(200, {"token": token, "role": "developer"})

            if route == "/api/join":
                invite_raw = str(body.get("code") or "").strip().upper()
                handle = str(body.get("handle") or "").strip()[:40]
                if not invite_raw:
                    return self._send_json(400, {"error": "Invite code required."})
                if not handle:
                    return self._send_json(
                        400, {"error": "Choose a short display handle (not an email)."}
                    )
                if "@" in handle:
                    return self._send_json(
                        400, {"error": "Do not use an email. Pick a handle."}
                    )
                invite = store["invites"].get(invite_raw)
                if not invite or invite["status"] != "open":
                    return self._send_json(
                        400, {"error": "Invite is invalid or already used."}
                    )
                invite["status"] = "used"
                invite["usedAt"] = utcnow()
                member_id = new_id("m")
                member = {
                    "id": member_id,
                    "handle": handle,
                    "role": invite["role"],
                    "status": "active",
                    "board": invite["board"],
                    "invitedBy": invite["createdByRole"],
                    "inviteCode": invite_raw,
                    "createdAt": utcnow(),
                }
                store["members"][member_id] = member
                token = create_session(store, invite["role"], member_id)
                log_event(
                    store,
                    "join",
                    {
                        "memberId": member_id,
                        "handle": handle,
                        "role": invite["role"],
                        "inviteCode": invite_raw,
                    },
                )
                save_store(store)
                return self._send_json(
                    200,
                    {
                        "token": token,
                        "role": invite["role"],
                        "member": public_member(member),
                    },
                )

            auth = self._auth(store)
            if not auth:
                return self._send_json(401, {"error": "Sign in required."})
            token, session = auth

            if route == "/api/logout":
                store["sessions"].pop(token, None)
                save_store(store)
                return self._send_json(200, {"ok": True})

            if route == "/api/dev/manager-invite":
                if session["role"] != "developer":
                    return self._send_json(403, {"error": "Developer only."})
                code = invite_code()
                store["invites"][code] = {
                    "code": code,
                    "role": "manager",
                    "board": "announcements",
                    "status": "open",
                    "createdByRole": "developer",
                    "createdAt": utcnow(),
                }
                log_event(store, "invite_created", {"inviteCode": code, "role": "manager"})
                save_store(store)
                return self._send_json(200, {"code": code, "role": "manager"})

            if route == "/api/dev/reset-pilot":
                if session["role"] != "developer":
                    return self._send_json(403, {"error": "Developer only."})
                if body.get("confirm") != "RESET":
                    return self._send_json(
                        400,
                        {
                            "error": 'Type confirm: "RESET" to wipe members, invites, and posts.'
                        },
                    )
                salt = store["developerPassSalt"]
                hashed = store["developerPassHash"]
                next_store = empty_store()
                next_store["setupComplete"] = True
                next_store["developerPassSalt"] = salt
                next_store["developerPassHash"] = hashed
                log_event(next_store, "reset_pilot", {"by": "developer"})
                new_token = create_session(next_store, "developer", None)
                save_store(next_store)
                return self._send_json(
                    200,
                    {
                        "token": new_token,
                        "role": "developer",
                        "message": "Pilot wiped. Create a new manager invite.",
                    },
                )

            if route == "/api/invites":
                if session["role"] not in ("manager", "developer"):
                    return self._send_json(403, {"error": "Manager or developer only."})
                code = invite_code()
                vouch = str(body.get("vouchLabel") or "").strip()[:80] or None
                store["invites"][code] = {
                    "code": code,
                    "role": "user",
                    "board": "announcements",
                    "status": "open",
                    "createdByRole": session["role"],
                    "createdByMemberId": session.get("memberId"),
                    "vouchLabel": vouch,
                    "createdAt": utcnow(),
                }
                log_event(
                    store,
                    "invite_created",
                    {"inviteCode": code, "role": "user", "vouchLabel": vouch},
                )
                save_store(store)
                return self._send_json(
                    200,
                    {
                        "code": code,
                        "role": "user",
                        "board": "announcements",
                        "vouchLabel": vouch,
                    },
                )

            if route == "/api/revoke":
                if session["role"] not in ("manager", "developer"):
                    return self._send_json(403, {"error": "Manager or developer only."})
                member_id = str(body.get("memberId") or "")
                member = store["members"].get(member_id)
                if not member:
                    return self._send_json(404, {"error": "Member not found."})
                if member["role"] == "manager" and session["role"] != "developer":
                    return self._send_json(
                        403, {"error": "Only the developer can revoke the manager."}
                    )
                member["status"] = "revoked"
                member["revokedAt"] = utcnow()
                for tok, sess in list(store["sessions"].items()):
                    if sess.get("memberId") == member_id:
                        del store["sessions"][tok]
                log_event(
                    store,
                    "revoke",
                    {
                        "memberId": member_id,
                        "handle": member["handle"],
                        "role": member["role"],
                    },
                )
                save_store(store)
                return self._send_json(200, {"member": public_member(member)})

            if route == "/api/posts":
                if session["role"] not in ("manager", "developer"):
                    return self._send_json(403, {"error": "Manager or developer only."})
                title = str(body.get("title") or "").strip()[:120]
                content = str(body.get("body") or "").strip()[:4000]
                if not title or not content:
                    return self._send_json(400, {"error": "Title and body required."})
                post = {
                    "id": new_id("post"),
                    "title": title,
                    "body": content,
                    "board": "announcements",
                    "createdAt": utcnow(),
                    "createdByRole": session["role"],
                }
                store["posts"].insert(0, post)
                log_event(store, "post", {"postId": post["id"], "title": title})
                save_store(store)
                return self._send_json(200, {"post": post})

            if route == "/api/leave":
                if session["role"] not in ("user", "manager"):
                    return self._send_json(400, {"error": "Nothing to leave."})
                member = store["members"].get(session.get("memberId"))
                if member:
                    member["status"] = "left"
                    member["leftAt"] = utcnow()
                    log_event(
                        store,
                        "leave",
                        {"memberId": member["id"], "handle": member["handle"]},
                    )
                store["sessions"].pop(token, None)
                save_store(store)
                return self._send_json(200, {"ok": True})

            return self._send_json(404, {"error": "Unknown API route."})


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"freeAB.app Stage 0 listening on http://localhost:{PORT}", flush=True)
    print(
        "Setup: open that URL. Developer first, then manager invite, then user invites.",
        flush=True,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
