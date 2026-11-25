# freeAB Project Rules

**Version:** 0.1  
**Date:** 2026-11-24  
**Status:** Active

These rules govern how work is conducted on freeAB.app.

## 1. Core Philosophy

- **Permission without possession** — the campaign may reach people who have given leave, without owning their contact details.
- Automation and agents support human judgment; organizers keep invite / revoke discipline.
- Clarity and maintainability beat premature protocol complexity.
- Stage 0 proves the social workflow before Stage 1 adds device-held keys and relays.

## 2. Source of Truth

- GitHub (`hughabercrombie/freeAB`) is the shared source of truth.
- Hugh owns local files on his machine; agents work in the Cursor Project / workspace.
- freeAB stays separate from ABDoorKnock (own repo and Cursor Project).

## 3. Documentation

- `README.md` — high-level overview and how to run the current stage.
- `docs/freeAB_app_concept_and_staged_plan.md` — concept and staged plan.
- `docs/freeAB_Build_Journal.md` — living build journal (decisions, work, failures). Kept current by The Scribe and by agents after meaningful steps.
- `docs/agents.md` — agent roles (starting with The Scribe).
- Once a journal day is written up, that day’s entry is not condensed or shortened later.

## 4. Artifacts and Code

- Prefer versioned, reviewable outputs for each stage.
- Stage 0 pilot data (`stage0/data/store.json`) stays gitignored.
- Superseded docs or experiments should be archived rather than deleted when practical.

## 5. Git and Agent Boundaries

- Default base branch is `main`.
- Commit messages should be clear and descriptive.
- Agent access is workspace-scoped. Approval is required for installs, network, git commit/push, deletes, and anything outside the project.

## 6. Continuity Across Sessions

When starting work in a new thread or after a break, reference:
- This rules document
- `docs/freeAB_app_concept_and_staged_plan.md`
- `docs/freeAB_Build_Journal.md` (latest stage status)
- `README.md` and the active stage folder (currently `stage0/`)

---

*End of freeAB Project Rules – 0.1*
