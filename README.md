# freeAB.app

Decentralized notice board and discussion layer for the Alberta independence movement.

**Permission without possession** — campaigns may reach people who have given leave, without owning their contact details.

## Stage 0 (current)

Multiuser invite / revoke drill. Roles: developer, manager, users.

```bash
cd stage0
python server.py
```

Open http://localhost:3847

See `stage0/README.md` and `docs/freeAB_app_concept_and_staged_plan.md`.

## Docs

- Concept & staged plan: `docs/freeAB_app_concept_and_staged_plan.md`
- Build journal: `docs/freeAB_Build_Journal.md` (living record; The Scribe helps maintain it)
- Agents: `docs/agents.md`
- Project rules: `docs/project_rules.md`

### The Scribe

Background journalling agent. After a meaningful decision, from the repo root:

```bash
python agents/the_scribe.py "We decided …"
```

End of thread / sync reminder: `python agents/the_scribe.py --remind`. See `docs/agents.md`.

## Branding

- Product / site: **freeAB.app**
- UI colors aligned with the ABDoorKnock overlay landing (navy / gold)
- Alberta flag mark — no third-party campaign logo
