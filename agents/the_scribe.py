#!/usr/bin/env python3
"""
The Scribe - Semi-Autonomous Background Journalling Agent

Role:
The Scribe operates in the background during active conversation.
It periodically evaluates discussion (triggered by the lead agent) and records
meaningful decisions along with the reasoning behind them.

Entry Requirements (strict):
- Record clear decisions and the logic/trade-offs behind them.
- Include detailed description of work performed, tools used, specific numbers,
  issues encountered, and how they were resolved.
- Capture both progress and failures with adequate detail.
- Date every daily entry.
- Once a day is written up, the entry remains unchanged in future updates
  (never condensed or shortened).
- Do NOT record general conversation summaries.

It stays quiet unless:
- It creates a journal entry, or
- It needs to remind the user to sync the journal (after 24h inactivity
  or at end of thread).

User responsibility:
- Keep the journal committed on GitHub (`docs/freeAB_Build_Journal.md`)
  via the normal Git / PR workflow for freeAB.

The Scribe does NOT require the user to feed it discussion summaries.
The lead agent manages context and triggers evaluation as needed.
"""

# Version: v0.1
# Timestamp: 2026-11-24 23:08 MDT

import datetime
from pathlib import Path
import re

REPO_ROOT = Path(__file__).resolve().parent.parent
JOURNAL_PATH = REPO_ROOT / "docs" / "freeAB_Build_Journal.md"
STATE_FILE = REPO_ROOT / "agents" / "scribe_state.txt"

INACTIVITY_THRESHOLD_HOURS = 24


def load_state():
    if not STATE_FILE.exists():
        return {"last_activity": None, "last_decision_hash": None}
    try:
        with open(STATE_FILE, "r") as f:
            lines = f.read().strip().splitlines()
            return {
                "last_activity": lines[0] if lines else None,
                "last_decision_hash": lines[1] if len(lines) > 1 else None,
            }
    except Exception:
        return {"last_activity": None, "last_decision_hash": None}


def save_state(last_activity, last_decision_hash):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        f.write(f"{last_activity}\n{last_decision_hash or ''}\n")


def detect_decisions(summary: str) -> list:
    """Extract decisions and reasoning from discussion summary."""
    decisions = []
    patterns = [
        r"(we decided|I decided|let's|we will|we should|agreed to|chose to)",
        r"(exclude|include|flag|merge|split|rename|keep|remove|defer|pause)",
    ]
    lines = summary.splitlines()
    reasoning_buffer = []

    for line in lines:
        if any(re.search(p, line.lower()) for p in patterns):
            decision = line.strip()
            reasoning = (
                " ".join(reasoning_buffer[-2:])
                if reasoning_buffer
                else "Discussed in conversation."
            )
            decisions.append((decision, reasoning))
            reasoning_buffer = []
        elif line.strip():
            reasoning_buffer.append(line.strip())
    return decisions


def should_create_entry(decisions: list) -> bool:
    return len(decisions) >= 1


def format_journal_entry(decisions: list) -> str:
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M MDT")
    lines = [f"## Scribe Entry – {ts}\n"]
    for decision, reasoning in decisions:
        lines.append(f"**Decision:** {decision}")
        lines.append(f"**Logic:** {reasoning}\n")
    lines.append("---\n")
    return "\n".join(lines)


def append_to_journal(entry: str):
    JOURNAL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(JOURNAL_PATH, "a", encoding="utf-8") as f:
        f.write("\n" + entry)


def check_long_inactivity(last_activity_str):
    if not last_activity_str:
        return False
    try:
        last = datetime.datetime.fromisoformat(last_activity_str)
        return (datetime.datetime.now() - last).total_seconds() > (
            INACTIVITY_THRESHOLD_HOURS * 3600
        )
    except Exception:
        return False


def run(summary: str = None, auto_append: bool = True, force_reminder: bool = False):
    state = load_state()
    now = datetime.datetime.now().isoformat()

    # Check for long inactivity or forced reminder (e.g. end of thread)
    if force_reminder or check_long_inactivity(state.get("last_activity")):
        print("\n[Scribe] Journal Sync Reminder")
        print("Please commit the current journal via your freeAB Git workflow.")
        print(f"Journal: {JOURNAL_PATH}")
        save_state(now, state.get("last_decision_hash"))
        return

    if not summary or not summary.strip():
        save_state(now, state.get("last_decision_hash"))
        return

    decisions = detect_decisions(summary)
    if not should_create_entry(decisions):
        save_state(now, state.get("last_decision_hash"))
        return

    entry = format_journal_entry(decisions)
    if auto_append:
        append_to_journal(entry)
        print("[Scribe] Journal entry added.")
    else:
        print("[Scribe] Proposed entry:\n" + entry)

    save_state(now, str(hash(str(decisions))))


if __name__ == "__main__":
    import sys

    summary = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else None
    force = "--remind" in sys.argv
    if force and summary:
        # Strip the flag from the summary text when both are present.
        parts = [p for p in sys.argv[1:] if p != "--remind"]
        summary = " ".join(parts) if parts else None
    run(summary=summary, auto_append=True, force_reminder=force and not summary)
