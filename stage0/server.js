/**
 * freeAB.app Stage 0 — multiuser invite / revoke / practice board
 * Roles: developer, manager, user. No email or phone collected.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = Number(process.env.PORT) || 3847;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

function code(groups = 3) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const parts = [];
  for (let g = 0; g < groups; g++) {
    let chunk = "";
    for (let i = 0; i < 4; i++) {
      chunk += alphabet[crypto.randomInt(alphabet.length)];
    }
    parts.push(chunk);
  }
  return parts.join("-");
}

function hashPass(pass, salt) {
  return crypto.scryptSync(String(pass), salt, 32).toString("hex");
}

function emptyStore() {
  return {
    setupComplete: false,
    developerPassSalt: null,
    developerPassHash: null,
    sessions: {},
    invites: {},
    members: {},
    posts: [],
    events: [],
  };
}

function loadStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    const s = emptyStore();
    saveStore(s);
    return s;
  }
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
}

function saveStore(store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = STORE_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
  fs.renameSync(tmp, STORE_PATH);
}

function logEvent(store, type, detail) {
  store.events.unshift({
    id: id("evt"),
    at: new Date().toISOString(),
    type,
    detail,
  });
  store.events = store.events.slice(0, 200);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function auth(store, req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const session = store.sessions[token];
  if (!session) return null;
  if (session.expiresAt && Date.now() > session.expiresAt) {
    delete store.sessions[token];
    saveStore(store);
    return null;
  }
  return { token, session };
}

function createSession(store, role, memberId) {
  const token = crypto.randomBytes(24).toString("hex");
  store.sessions[token] = {
    role,
    memberId: memberId || null,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 14,
  };
  return token;
}

function publicMember(m) {
  return {
    id: m.id,
    handle: m.handle,
    role: m.role,
    status: m.status,
    board: m.board,
    invitedBy: m.invitedBy,
    createdAt: m.createdAt,
    revokedAt: m.revokedAt || null,
  };
}

async function handleApi(req, res, store) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const route = url.pathname.replace(/\/+$/, "") || "/";
  const method = req.method;

  if (method === "GET" && route === "/api/health") {
    return send(res, 200, {
      ok: true,
      product: "freeAB.app",
      stage: 0,
      setupComplete: store.setupComplete,
    });
  }

  if (method === "GET" && route === "/api/status") {
    return send(res, 200, {
      setupComplete: store.setupComplete,
      stage: 0,
      product: "freeAB.app",
      counts: {
        activeMembers: Object.values(store.members).filter((m) => m.status === "active").length,
        openInvites: Object.values(store.invites).filter((i) => i.status === "open").length,
        posts: store.posts.length,
      },
    });
  }

  // First-run: developer sets passphrase
  if (method === "POST" && route === "/api/setup") {
    if (store.setupComplete) return send(res, 400, { error: "Pilot already set up." });
    const body = await readBody(req);
    const pass = String(body.passphrase || "").trim();
    if (pass.length < 8) {
      return send(res, 400, { error: "Use a passphrase of at least 8 characters." });
    }
    const salt = crypto.randomBytes(16).toString("hex");
    store.developerPassSalt = salt;
    store.developerPassHash = hashPass(pass, salt);
    store.setupComplete = true;
    logEvent(store, "setup", { by: "developer" });
    const token = createSession(store, "developer", null);
    saveStore(store);
    return send(res, 200, {
      token,
      role: "developer",
      message: "Pilot ready. Create a manager invite next.",
    });
  }

  if (method === "POST" && route === "/api/dev/login") {
    if (!store.setupComplete) return send(res, 400, { error: "Run setup first." });
    const body = await readBody(req);
    const pass = String(body.passphrase || "");
    const ok =
      hashPass(pass, store.developerPassSalt) === store.developerPassHash;
    if (!ok) return send(res, 401, { error: "Wrong passphrase." });
    const token = createSession(store, "developer", null);
    saveStore(store);
    return send(res, 200, { token, role: "developer" });
  }

  if (method === "POST" && route === "/api/join") {
    const body = await readBody(req);
    const inviteCode = String(body.code || "")
      .trim()
      .toUpperCase();
    const handle = String(body.handle || "")
      .trim()
      .slice(0, 40);
    if (!inviteCode) return send(res, 400, { error: "Invite code required." });
    if (!handle) return send(res, 400, { error: "Choose a short display handle (not an email)." });
    if (handle.includes("@")) {
      return send(res, 400, { error: "Do not use an email. Pick a handle." });
    }

    const invite = store.invites[inviteCode];
    if (!invite || invite.status !== "open") {
      return send(res, 400, { error: "Invite is invalid or already used." });
    }

    invite.status = "used";
    invite.usedAt = new Date().toISOString();

    const memberId = id("m");
    const member = {
      id: memberId,
      handle,
      role: invite.role,
      status: "active",
      board: invite.board,
      invitedBy: invite.createdByRole,
      inviteCode,
      createdAt: new Date().toISOString(),
    };
    store.members[memberId] = member;
    const token = createSession(store, invite.role, memberId);
    logEvent(store, "join", {
      memberId,
      handle,
      role: invite.role,
      inviteCode,
    });
    saveStore(store);
    return send(res, 200, {
      token,
      role: invite.role,
      member: publicMember(member),
    });
  }

  const authed = auth(store, req);
  if (!authed && method !== "GET") {
    // fall through for unauthenticated GET handled above
  }

  if (method === "GET" && route === "/api/me") {
    if (!authed) return send(res, 401, { error: "Sign in required." });
    const { session } = authed;
    const member = session.memberId ? store.members[session.memberId] : null;
    return send(res, 200, {
      role: session.role,
      member: member ? publicMember(member) : null,
      setupComplete: store.setupComplete,
    });
  }

  if (!authed) return send(res, 401, { error: "Sign in required." });
  const { session } = authed;

  if (method === "POST" && route === "/api/logout") {
    delete store.sessions[authed.token];
    saveStore(store);
    return send(res, 200, { ok: true });
  }

  // Developer: create manager invite
  if (method === "POST" && route === "/api/dev/manager-invite") {
    if (session.role !== "developer") return send(res, 403, { error: "Developer only." });
    const inviteCode = code(3);
    store.invites[inviteCode] = {
      code: inviteCode,
      role: "manager",
      board: "announcements",
      status: "open",
      createdByRole: "developer",
      createdAt: new Date().toISOString(),
    };
    logEvent(store, "invite_created", { inviteCode, role: "manager" });
    saveStore(store);
    return send(res, 200, { code: inviteCode, role: "manager" });
  }

  // Developer: reset pilot (keeps passphrase)
  if (method === "POST" && route === "/api/dev/reset-pilot") {
    if (session.role !== "developer") return send(res, 403, { error: "Developer only." });
    const body = await readBody(req);
    if (body.confirm !== "RESET") {
      return send(res, 400, { error: 'Type confirm: "RESET" to wipe members, invites, and posts.' });
    }
    const salt = store.developerPassSalt;
    const hash = store.developerPassHash;
    const next = emptyStore();
    next.setupComplete = true;
    next.developerPassSalt = salt;
    next.developerPassHash = hash;
    logEvent(next, "reset_pilot", { by: "developer" });
    const token = createSession(next, "developer", null);
    saveStore(next);
    Object.assign(store, next);
    return send(res, 200, { token, role: "developer", message: "Pilot wiped. Create a new manager invite." });
  }

  // Manager or developer: create user invite
  if (method === "POST" && route === "/api/invites") {
    if (session.role !== "manager" && session.role !== "developer") {
      return send(res, 403, { error: "Manager or developer only." });
    }
    const body = await readBody(req);
    const board = body.board === "volunteers" ? "volunteers" : "announcements";
    // Stage 0: only announcements for users in the drill
    const inviteCode = code(3);
    store.invites[inviteCode] = {
      code: inviteCode,
      role: "user",
      board: "announcements",
      status: "open",
      createdByRole: session.role,
      createdByMemberId: session.memberId,
      // Optional short vouch label — not contact info
      vouchLabel: String(body.vouchLabel || "").trim().slice(0, 80) || null,
      createdAt: new Date().toISOString(),
    };
    logEvent(store, "invite_created", {
      inviteCode,
      role: "user",
      board,
      vouchLabel: store.invites[inviteCode].vouchLabel,
    });
    saveStore(store);
    return send(res, 200, {
      code: inviteCode,
      role: "user",
      board: "announcements",
      vouchLabel: store.invites[inviteCode].vouchLabel,
    });
  }

  if (method === "GET" && route === "/api/invites") {
    if (session.role !== "manager" && session.role !== "developer") {
      return send(res, 403, { error: "Manager or developer only." });
    }
    const list = Object.values(store.invites)
      .map((i) => ({
        code: i.code,
        role: i.role,
        board: i.board,
        status: i.status,
        vouchLabel: i.vouchLabel || null,
        createdAt: i.createdAt,
        usedAt: i.usedAt || null,
      }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return send(res, 200, { invites: list });
  }

  if (method === "GET" && route === "/api/members") {
    if (session.role !== "manager" && session.role !== "developer") {
      return send(res, 403, { error: "Manager or developer only." });
    }
    const list = Object.values(store.members)
      .map(publicMember)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return send(res, 200, { members: list });
  }

  if (method === "POST" && route === "/api/revoke") {
    if (session.role !== "manager" && session.role !== "developer") {
      return send(res, 403, { error: "Manager or developer only." });
    }
    const body = await readBody(req);
    const memberId = String(body.memberId || "");
    const member = store.members[memberId];
    if (!member) return send(res, 404, { error: "Member not found." });
    if (member.role === "manager" && session.role !== "developer") {
      return send(res, 403, { error: "Only the developer can revoke the manager." });
    }
    member.status = "revoked";
    member.revokedAt = new Date().toISOString();
    for (const [tok, s] of Object.entries(store.sessions)) {
      if (s.memberId === memberId) delete store.sessions[tok];
    }
    logEvent(store, "revoke", { memberId, handle: member.handle, role: member.role });
    saveStore(store);
    return send(res, 200, { member: publicMember(member) });
  }

  if (method === "GET" && route === "/api/posts") {
    if (session.role === "user") {
      const member = store.members[session.memberId];
      if (!member || member.status !== "active") {
        return send(res, 403, { error: "Access revoked or left." });
      }
    }
    return send(res, 200, {
      posts: store.posts.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    });
  }

  if (method === "POST" && route === "/api/posts") {
    if (session.role !== "manager" && session.role !== "developer") {
      return send(res, 403, { error: "Manager or developer only." });
    }
    const body = await readBody(req);
    const title = String(body.title || "").trim().slice(0, 120);
    const content = String(body.body || "").trim().slice(0, 4000);
    if (!title || !content) return send(res, 400, { error: "Title and body required." });
    const post = {
      id: id("post"),
      title,
      body: content,
      board: "announcements",
      createdAt: new Date().toISOString(),
      createdByRole: session.role,
    };
    store.posts.unshift(post);
    logEvent(store, "post", { postId: post.id, title });
    saveStore(store);
    return send(res, 200, { post });
  }

  if (method === "POST" && route === "/api/leave") {
    if (session.role !== "user" && session.role !== "manager") {
      return send(res, 400, { error: "Nothing to leave." });
    }
    const member = store.members[session.memberId];
    if (member) {
      member.status = "left";
      member.leftAt = new Date().toISOString();
      logEvent(store, "leave", { memberId: member.id, handle: member.handle });
    }
    delete store.sessions[authed.token];
    saveStore(store);
    return send(res, 200, { ok: true });
  }

  if (method === "GET" && route === "/api/events") {
    if (session.role !== "developer" && session.role !== "manager") {
      return send(res, 403, { error: "Not allowed." });
    }
    return send(res, 200, { events: store.events.slice(0, 50) });
  }

  return send(res, 404, { error: "Unknown API route." });
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.normalize(path.join(PUBLIC, urlPath));
  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

const store = loadStore();

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) {
      return await handleApi(req, res, store);
    }
    if (req.method === "GET" || req.method === "HEAD") {
      return serveStatic(req, res);
    }
    res.writeHead(405);
    res.end("Method not allowed");
  } catch (err) {
    console.error(err);
    send(res, 500, { error: err.message || "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`freeAB.app Stage 0 listening on http://localhost:${PORT}`);
  console.log(`Setup: open that URL. Developer first, then manager invite, then user invites.`);
});
