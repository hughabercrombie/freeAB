# freeAB.app – Build Journal & Lessons Learned

**Purpose:**  
This living document records every significant step, decision, success, and failure as we build freeAB.app. It serves two goals:
1. Provide a transparent, searchable record of what actually worked (and what didn’t) during development.
2. Evolve into a reusable **checklist / playbook** for later stages (device-held keys, relays, private rooms) and for related campaign tooling.

**Philosophy:**  
Permission without possession. Human vetting and invite discipline come before protocol sophistication. Stage 0 proves organizers will invite and revoke before Stage 1 adds Nostr-style keys and relays. Clarity and maintainability beat premature decentralization theatre.

**How to use this journal:**  
- Each stage (or meaningful sub-phase) gets its own section.
- Record: date/time, action taken, inputs/outputs, what worked, what didn’t / bugs encountered, decisions made + rationale, and notes for later stages.
- The Scribe (`agents/the_scribe.py`) and the lead agent help keep this updated after each meaningful step.
- Once a day is written up, that day’s entry is not condensed or shortened later.

---

## Stage 0 – Repository & Multiuser Invite Drill (On main)

**Date:** 2026-11-24  
**Status:** Complete on `main` (initial commit `9896e27`)

**Summary:**  
freeAB landed as its own GitHub repository (`hughabercrombie/freeAB`), separate from ABDoorKnock. Stage 0 multiuser invite / revoke drill and the concept / staged plan shipped together so organizers can practice the door before any decentralized stack.

**Key Decisions:**
- Keep freeAB in its own repo and Cursor Project — do not fold it into ABDoorKnock.
- Prefer GitHub as the shared source of truth; Hugh owns local files on his machine.
- Stage 0 uses a simple shared pilot server (`stage0/`) with roles developer / manager / user — **not** Nostr yet.
- Product name / site: **freeAB.app**. Branding uses navy / gold aligned with the ABDoorKnock overlay landing; Alberta flag mark only (no third-party campaign logo).
- Non-negotiables from the concept plan stand: user sovereignty, no contact disclosure, device-held identity in later stages, human vetting via invites.

**Artifacts:**
- `README.md` — high-level overview and Stage 0 run instructions
- `docs/freeAB_app_concept_and_staged_plan.md` — concept, decentralization framing, Stages 0–6 plan, non-negotiables
- `stage0/` — Python stdlib server (`server.py`), optional Node wrapper, static UI (`public/`), pilot README
- `.gitignore` — ignores Stage 0 pilot data (`stage0/data/store.json`) and common junk

**What worked:**
- Stage 0 is runnable with `cd stage0 && python server.py` → http://localhost:3847
- Pilot script covers create manager invite → user invites → announce → revoke → leave
- Concept plan maps Stages 0–6 from invite discipline through private rooms, mute, replies, dependability, and careful growth

**Notes for later stages / Checklist:**
- Confirm organizers will revoke in Stage 0 before investing in Stage 1 keys/relays.
- Stage 1: device-held keys, Face ID unlock, announcement board; still no org-held contact list.
- Keep commerce / marketplace identity (if ever) as a separate doorway from political membership.
- Riding stays a phone-side preference, not an org CRM field.

---

## Project start – Cursor Project & Scribe (2026-11-24)

**Date:** 2026-11-24  
**Status:** In progress

**Summary:**  
Opened the freeAB Cursor Project with workspace-scoped agent access. Ported the ABDoorKnock Scribe / build-journal pattern so freeAB keeps a living decision record from day one.

**Key Decisions:**
- Mirror ABDoorKnock roles and journal conventions, adapted to freeAB names and paths (not a blind copy of door-knock content).
- Journal path: `docs/freeAB_Build_Journal.md`.
- Scribe entry point: `agents/the_scribe.py` (repo-relative paths; state file `agents/scribe_state.txt` is local-only / gitignored).
- Agent access stays workspace-scoped; approval required for installs, network, git commit/push, deletes, and anything outside the project.

**Artifacts:**
- `agents/the_scribe.py`
- `docs/agents.md`
- `docs/project_rules.md`
- `docs/freeAB_Build_Journal.md` (this file)

**Next actions:**
- Land scribe + journal docs via PR to `main` (do not merge without Hugh’s review).
- After meaningful Stage 0 pilot runs or Stage 1 design decisions, append journal entries (Scribe or manual) without rewriting earlier days.

---

*This entry was written in full detail on the day the work occurred and will not be condensed in future updates.*

*This journal will be updated after every meaningful step. It is intended to become the authoritative “how we actually did it” record for freeAB.app.*

## Scribe Entry – 2026-11-25 05:23 MDT

**Decision:** We decided supporters vs volunteers are two trust tiers: supporters stay on Announcements (first invite); volunteers need extra vetting and a separate second-tier channel (Volunteers/Strategy on a closed relay from Stage 2+). Longer term, freeAB or a companion app should serve as Overlay-like volunteer tooling without folding door-knock GIS/volunteer DB into the supporter inbox. Stage 0–1 remain Announcements-only.
**Logic:** Discussed in conversation.

---
