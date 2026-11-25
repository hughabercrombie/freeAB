(() => {
  const TOKEN_KEY = "freeab_stage0_token";
  const view = document.getElementById("view");
  const chip = document.getElementById("session-chip");

  const state = {
    token: localStorage.getItem(TOKEN_KEY) || "",
    me: null,
    status: null,
    flash: null,
  };

  function setToken(token) {
    state.token = token || "";
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  async function api(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    const res = await fetch(path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function flash(message, kind = "ok") {
    state.flash = { message, kind };
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtTime(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  function renderFlash() {
    if (!state.flash) return "";
    const { message, kind } = state.flash;
    return `<div class="banner ${kind}">${escapeHtml(message)}</div>`;
  }

  function updateChip() {
    if (!state.me) {
      chip.classList.add("hidden");
      chip.textContent = "";
      return;
    }
    const handle = state.me.member?.handle;
    const label = handle
      ? `${state.me.role} · ${handle}`
      : state.me.role;
    chip.textContent = label;
    chip.classList.remove("hidden");
  }

  function gateScreen() {
    const setup = state.status?.setupComplete;
    view.innerHTML = `
      <section class="panel hero-copy">
        ${renderFlash()}
        <h1>Practice the door.</h1>
        <p class="lede">
          Stage 0 is a small multiuser drill: one developer, one manager, a few users.
          Issue invites, redeem them, revoke someone, and post a practice notice.
          No contact details are collected.
        </p>
        <div class="role-grid">
          <button class="role-card" data-go="developer">
            <strong>Developer</strong>
            <span>You. Set up the pilot, mint the manager invite, reset if needed.</span>
          </button>
          <button class="role-card" data-go="manager">
            <strong>Manager</strong>
            <span>Org side. Invite users, revoke access, post announcements.</span>
          </button>
          <button class="role-card" data-go="user">
            <strong>User</strong>
            <span>Supporter side. Redeem an invite, read the board, leave.</span>
          </button>
        </div>
        <p class="meta" style="margin-top:1rem">
          Pilot ${setup ? "is set up" : "needs first-time developer setup"} ·
          ${state.status?.counts?.activeMembers ?? 0} active ·
          ${state.status?.counts?.openInvites ?? 0} open invites
        </p>
      </section>
    `;
    view.querySelectorAll("[data-go]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.flash = null;
        if (btn.dataset.go === "developer") renderDeveloperAuth();
        if (btn.dataset.go === "manager") renderJoin("manager");
        if (btn.dataset.go === "user") renderJoin("user");
      });
    });
  }

  function renderDeveloperAuth() {
    const setup = state.status?.setupComplete;
    view.innerHTML = `
      <section class="panel stack">
        <button class="secondary" type="button" id="back">← Roles</button>
        ${renderFlash()}
        <div>
          <h2 class="section-title">${setup ? "Developer sign-in" : "Developer setup"}</h2>
          <p class="sub">${
            setup
              ? "Enter the pilot passphrase you chose at setup."
              : "Choose a passphrase (8+ characters). This is only for you as developer."
          }</p>
        </div>
        <label>
          Passphrase
          <input id="pass" type="password" autocomplete="current-password" />
        </label>
        <div class="row">
          <button type="button" id="go">${setup ? "Sign in" : "Create pilot"}</button>
        </div>
      </section>
    `;
    view.querySelector("#back").onclick = () => {
      state.flash = null;
      gateScreen();
    };
    view.querySelector("#go").onclick = async () => {
      const passphrase = view.querySelector("#pass").value;
      try {
        const data = setup
          ? await api("/api/dev/login", { method: "POST", body: JSON.stringify({ passphrase }) })
          : await api("/api/setup", { method: "POST", body: JSON.stringify({ passphrase }) });
        setToken(data.token);
        flash(data.message || "Signed in as developer.");
        await refreshMe();
        await renderApp();
      } catch (e) {
        flash(e.message, "error");
        renderDeveloperAuth();
      }
    };
  }

  function renderJoin(expectedRole) {
    view.innerHTML = `
      <section class="panel stack">
        <button class="secondary" type="button" id="back">← Roles</button>
        ${renderFlash()}
        <div>
          <h2 class="section-title">Join as ${expectedRole}</h2>
          <p class="sub">
            Paste your single-use invite. Pick a short handle — not an email or phone number.
          </p>
        </div>
        <label>
          Invite code
          <input id="code" type="text" autocomplete="off" spellcheck="false" placeholder="XXXX-XXXX-XXXX" />
        </label>
        <label>
          Display handle
          <input id="handle" type="text" maxlength="40" placeholder="e.g. PrairieOwl" />
        </label>
        <div class="row">
          <button type="button" id="go">Enter</button>
        </div>
      </section>
    `;
    view.querySelector("#back").onclick = () => {
      state.flash = null;
      gateScreen();
    };
    view.querySelector("#go").onclick = async () => {
      try {
        const data = await api("/api/join", {
          method: "POST",
          body: JSON.stringify({
            code: view.querySelector("#code").value,
            handle: view.querySelector("#handle").value,
          }),
        });
        if (expectedRole && data.role !== expectedRole) {
          flash(`This invite is for ${data.role}, not ${expectedRole}.`, "warn");
        } else {
          flash(`Welcome, ${data.member.handle}.`);
        }
        setToken(data.token);
        await refreshMe();
        await renderApp();
      } catch (e) {
        flash(e.message, "error");
        renderJoin(expectedRole);
      }
    };
  }

  async function renderApp() {
    updateChip();
    if (!state.me) {
      gateScreen();
      return;
    }
    if (state.me.role === "developer") return renderDeveloper();
    if (state.me.role === "manager") return renderManager();
    return renderUser();
  }

  async function logout() {
    try {
      await api("/api/logout", { method: "POST", body: "{}" });
    } catch {
      /* ignore */
    }
    setToken("");
    state.me = null;
    state.flash = null;
    updateChip();
    state.status = await api("/api/status");
    gateScreen();
  }

  async function renderDeveloper() {
    const [invites, members, events, posts] = await Promise.all([
      api("/api/invites"),
      api("/api/members"),
      api("/api/events"),
      api("/api/posts"),
    ]);
    const openManager = invites.invites.find((i) => i.role === "manager" && i.status === "open");

    view.innerHTML = `
      <div class="stack">
        ${renderFlash()}
        <section class="panel stack">
          <div class="row" style="justify-content:space-between">
            <div>
              <h2 class="section-title">Developer</h2>
              <p class="sub">Bootstrap the manager, watch the audit, reset the pilot if the drill goes sideways.</p>
            </div>
            <button class="secondary" type="button" id="logout">Sign out</button>
          </div>
          <div class="row">
            <button type="button" id="mint-manager">Create manager invite</button>
            <button class="danger" type="button" id="reset">Reset pilot</button>
          </div>
          ${
            openManager
              ? `<div class="banner warn">Open manager invite — give this once:<div class="code-block" style="margin-top:0.6rem">${escapeHtml(openManager.code)}</div></div>`
              : `<div class="banner ok">No open manager invite. Create one, then send it to your org-side manager.</div>`
          }
        </section>

        <div class="split">
          <section class="panel">
            <h2 class="section-title">Members</h2>
            <p class="sub">Handles and roles only — no contact fields.</p>
            ${renderMembersTable(members.members, { canRevoke: true, includeManager: true })}
          </section>
          <section class="panel">
            <h2 class="section-title">Recent events</h2>
            <div class="list">
              ${
                events.events.length
                  ? events.events
                      .slice(0, 12)
                      .map(
                        (e) => `
                    <div class="item">
                      <strong>${escapeHtml(e.type)}</strong>
                      <p class="meta">${escapeHtml(fmtTime(e.at))} · ${escapeHtml(JSON.stringify(e.detail))}</p>
                    </div>`
                      )
                      .join("")
                  : `<p class="sub">No events yet.</p>`
              }
            </div>
          </section>
        </div>

        <section class="panel">
          <h2 class="section-title">Announcements (${posts.posts.length})</h2>
          ${renderPosts(posts.posts)}
        </section>
      </div>
    `;

    view.querySelector("#logout").onclick = logout;
    view.querySelector("#mint-manager").onclick = async () => {
      try {
        const data = await api("/api/dev/manager-invite", { method: "POST", body: "{}" });
        flash(`Manager invite created: ${data.code}`);
        await renderDeveloper();
      } catch (e) {
        flash(e.message, "error");
        await renderDeveloper();
      }
    };
    view.querySelector("#reset").onclick = async () => {
      if (!confirm("Wipe members, invites, and posts? Your developer passphrase stays.")) return;
      try {
        const data = await api("/api/dev/reset-pilot", {
          method: "POST",
          body: JSON.stringify({ confirm: "RESET" }),
        });
        setToken(data.token);
        flash(data.message || "Pilot reset.");
        await refreshMe();
        await renderDeveloper();
      } catch (e) {
        flash(e.message, "error");
        await renderDeveloper();
      }
    };
    bindRevokeButtons();
  }

  async function renderManager() {
    const [invites, members, posts] = await Promise.all([
      api("/api/invites"),
      api("/api/members"),
      api("/api/posts"),
    ]);
    const latestOpen = invites.invites.find((i) => i.role === "user" && i.status === "open");

    view.innerHTML = `
      <div class="stack">
        ${renderFlash()}
        <section class="panel stack">
          <div class="row" style="justify-content:space-between">
            <div>
              <h2 class="section-title">Manager</h2>
              <p class="sub">Invite supporters, revoke access, post to Announcements. Keep vouch notes in your head or a private notebook — not as phone numbers here.</p>
            </div>
            <div class="row">
              <button class="secondary" type="button" id="leave">Leave</button>
              <button class="secondary" type="button" id="logout">Sign out</button>
            </div>
          </div>
          <label>
            Optional vouch label (who you know them as — not contact info)
            <input id="vouch" type="text" maxlength="80" placeholder="e.g. met at town hall — Sam" />
          </label>
          <div class="row">
            <button type="button" id="invite">Create user invite</button>
          </div>
          ${
            latestOpen
              ? `<div class="banner ok">Latest open invite — send to one person only:<div class="code-block" style="margin-top:0.6rem">${escapeHtml(latestOpen.code)}</div></div>`
              : ""
          }
        </section>

        <section class="panel stack">
          <h2 class="section-title">Post announcement</h2>
          <label>Title<input id="title" type="text" maxlength="120" /></label>
          <label>Body<textarea id="body"></textarea></label>
          <div class="row"><button type="button" id="post">Publish</button></div>
        </section>

        <section class="panel">
          <h2 class="section-title">People at the door</h2>
          <p class="sub">Revoke ends their session on the next action.</p>
          ${renderMembersTable(
            members.members.filter((m) => m.role === "user"),
            { canRevoke: true }
          )}
        </section>

        <section class="panel">
          <h2 class="section-title">Invites</h2>
          ${renderInvites(invites.invites.filter((i) => i.role === "user"))}
        </section>

        <section class="panel">
          <h2 class="section-title">Board</h2>
          ${renderPosts(posts.posts)}
        </section>
      </div>
    `;

    view.querySelector("#logout").onclick = logout;
    view.querySelector("#leave").onclick = async () => {
      if (!confirm("Leave the pilot as manager?")) return;
      await api("/api/leave", { method: "POST", body: "{}" });
      setToken("");
      state.me = null;
      flash("You left.", "warn");
      updateChip();
      state.status = await api("/api/status");
      gateScreen();
    };
    view.querySelector("#invite").onclick = async () => {
      try {
        const data = await api("/api/invites", {
          method: "POST",
          body: JSON.stringify({ vouchLabel: view.querySelector("#vouch").value }),
        });
        flash(`User invite: ${data.code}`);
        await renderManager();
      } catch (e) {
        flash(e.message, "error");
        await renderManager();
      }
    };
    view.querySelector("#post").onclick = async () => {
      try {
        await api("/api/posts", {
          method: "POST",
          body: JSON.stringify({
            title: view.querySelector("#title").value,
            body: view.querySelector("#body").value,
          }),
        });
        flash("Announcement published.");
        await renderManager();
      } catch (e) {
        flash(e.message, "error");
        await renderManager();
      }
    };
    bindRevokeButtons();
  }

  async function renderUser() {
    let posts;
    try {
      posts = await api("/api/posts");
    } catch (e) {
      flash(e.message, "error");
      setToken("");
      state.me = null;
      updateChip();
      state.status = await api("/api/status");
      gateScreen();
      return;
    }
    const handle = state.me.member?.handle || "supporter";
    view.innerHTML = `
      <div class="stack">
        ${renderFlash()}
        <section class="panel stack">
          <div class="row" style="justify-content:space-between">
            <div>
              <h2 class="section-title">Announcements</h2>
              <p class="sub">Signed in as ${escapeHtml(handle)}. This is the practice board.</p>
            </div>
            <div class="row">
              <button class="secondary" type="button" id="leave">Leave</button>
              <button class="secondary" type="button" id="logout">Sign out</button>
            </div>
          </div>
        </section>
        <section class="panel">
          ${renderPosts(posts.posts)}
        </section>
      </div>
    `;
    view.querySelector("#logout").onclick = logout;
    view.querySelector("#leave").onclick = async () => {
      await api("/api/leave", { method: "POST", body: "{}" });
      setToken("");
      state.me = null;
      flash("You left the board.", "warn");
      updateChip();
      state.status = await api("/api/status");
      gateScreen();
    };
  }

  function renderPosts(posts) {
    if (!posts.length) return `<p class="sub">No posts yet.</p>`;
    return `<div class="list">${posts
      .map(
        (p) => `
      <article class="item">
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.body)}</p>
        <p class="meta">${escapeHtml(fmtTime(p.createdAt))} · ${escapeHtml(p.createdByRole)}</p>
      </article>`
      )
      .join("")}</div>`;
  }

  function renderInvites(invites) {
    if (!invites.length) return `<p class="sub">No user invites yet.</p>`;
    return `
      <table class="table-like">
        <thead><tr><th>Code</th><th>Status</th><th>Vouch label</th><th>Created</th></tr></thead>
        <tbody>
          ${invites
            .map(
              (i) => `
            <tr>
              <td><code>${escapeHtml(i.code)}</code></td>
              <td><span class="pill ${escapeHtml(i.status)}">${escapeHtml(i.status)}</span></td>
              <td>${escapeHtml(i.vouchLabel || "—")}</td>
              <td>${escapeHtml(fmtTime(i.createdAt))}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
  }

  function renderMembersTable(members, { canRevoke = false, includeManager = false } = {}) {
    const rows = includeManager ? members : members;
    if (!rows.length) return `<p class="sub">Nobody here yet.</p>`;
    return `
      <table class="table-like">
        <thead><tr><th>Handle</th><th>Role</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${rows
            .map((m) => {
              const revoke =
                canRevoke && m.status === "active" && m.role !== "developer"
                  ? `<button class="danger" data-revoke="${escapeHtml(m.id)}" type="button">Revoke</button>`
                  : "";
              return `
              <tr>
                <td>${escapeHtml(m.handle)}</td>
                <td>${escapeHtml(m.role)}</td>
                <td><span class="pill ${escapeHtml(m.status)}">${escapeHtml(m.status)}</span></td>
                <td>${revoke}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>`;
  }

  function bindRevokeButtons() {
    view.querySelectorAll("[data-revoke]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Revoke this person? Their session ends.")) return;
        try {
          await api("/api/revoke", {
            method: "POST",
            body: JSON.stringify({ memberId: btn.dataset.revoke }),
          });
          flash("Access revoked.");
          await renderApp();
        } catch (e) {
          flash(e.message, "error");
          await renderApp();
        }
      });
    });
  }

  async function refreshMe() {
    if (!state.token) {
      state.me = null;
      return;
    }
    try {
      state.me = await api("/api/me");
    } catch {
      setToken("");
      state.me = null;
    }
  }

  async function boot() {
    try {
      state.status = await api("/api/status");
    } catch (e) {
      view.innerHTML = `<section class="panel"><div class="banner error">Cannot reach the Stage 0 server. In <code>freeab/stage0</code> run <code>python server.py</code>.</div></section>`;
      return;
    }
    await refreshMe();
    updateChip();
    if (state.me) await renderApp();
    else gateScreen();
  }

  boot();
})();
