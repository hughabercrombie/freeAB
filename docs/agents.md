# Agents

This document describes semi-autonomous agents operating in the freeAB project.

## The Scribe

**Role**  
Background journalling agent responsible for recording meaningful decisions and the reasoning behind them.

**Operating Model (Semi-Autonomous)**  
- The Scribe runs in the background during active conversation.  
- The lead agent periodically evaluates recent discussion and feeds relevant context to The Scribe.  
- The Scribe decides autonomously whether a journal entry is warranted.  
- It remains quiet unless it creates a journal entry or needs to issue a reminder.  
- The user does **not** feed discussion summaries to The Scribe.

**What The Scribe Records**  
- Clear decisions made during the project.  
- A concise synopsis of the logic or trade-offs behind each decision.  
- Detailed description of work performed, including specific numbers, tools used, issues encountered, and how they were resolved.  
- Progress and failures must be recorded with adequate detail.  
- Once a day is written up, the entry remains as is and is never condensed or shortened in subsequent updates.  
- It does **not** record general conversation summaries.

**Journal Management**  
- The journal lives in the repo at `docs/freeAB_Build_Journal.md`.  
- GitHub (`hughabercrombie/freeAB`) is the shared source of truth; journal updates land via normal commit / PR workflow.

**Long-Running Operation & Thread End Rule**  
After 24 hours of unattended semi-autonomous operation, or when the user signals the end of a thread, The Scribe will proactively remind the user to commit the current journal so it stays synced on GitHub.

**How to invoke**  
From the repo root (or any cwd — paths resolve from the script location):

```bash
# Append a decision-bearing summary (lead agent / Hugh after a meaningful step)
python agents/the_scribe.py "We decided to keep Stage 0 on a shared pilot server until Stage 1."

# Preview without relying on CLI alone: call run(..., auto_append=False) from Python
# Force a sync reminder (e.g. end of thread)
python agents/the_scribe.py --remind
```

In Cursor / Project agent sessions, the lead agent should call The Scribe after meaningful decisions rather than waiting for Hugh to paste summaries.

**User Responsibilities**  
- Review journal diffs when The Scribe (or an agent) updates them.  
- Commit and push the journal via the freeAB Git / PR workflow.  
- No other interaction with The Scribe is required during normal operation.

**Future Evolution**  
The Scribe may be extended with improved decision detection or additional agents as the project evolves.
