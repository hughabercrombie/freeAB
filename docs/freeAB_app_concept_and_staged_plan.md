# freeAB.app — Concept and Staged Development Plan

*A decentralized notice board and discussion layer for the Alberta independence movement.*

---

## 1. Introduction

**freeAB.app** is a proposed mobile-friendly application that lets a campaign speak to supporters—and lets supporters follow and, where appropriate, discuss—without handing the organization a traditional contact list.

People join with a one-time invite from someone they trust. They unlock the app with Face ID or a fingerprint. They see boards they have leave for. The campaign posts notices. On more tightly vetted boards, people may eventually comment under those posts. Anyone can leave. Organizers can revoke access. The organization does **not** receive phone numbers, email addresses, or a permanent registry of who is who.

There are two participant paths, not one:

- **Supporters** — the wide consent inbox: receive Announcements; treat that channel as readable by opponents.
- **Volunteers** — a separate, harder door: coordination and (later) field tooling only after extra human vetting; never mixed into the supporter Announcements path.

The name **freeAB.app** is the product and the site. It reflects the political aim (a free Alberta). The technical aim is simpler: **permission without possession**—the campaign may reach people who have given leave, without owning their contact details.

---

## 2. Supporters versus volunteers

These are different trust problems. freeAB must not collapse them into one list or one channel.

| | Supporter | Volunteer |
| --- | --- | --- |
| **Job** | Hear the campaign; optionally mute or leave | Do campaign work: coordinate, and later use field/volunteer tooling |
| **Channel** | Announcements (wide board) | Separate Volunteers / Strategy boards — not the Announcements feed |
| **Vetting** | First single-use invite from someone known | Second, named approval / stronger invite after organizers vouch offline |
| **Sensitivity** | Assume opponents can read it | Closed relay you control; admitted keys only |
| **Near term** | Stage 0 drill + Stage 1 MVP | Named in the plan; private rooms from Stage 2; Overlay-like tooling later |
| **What the org holds** | Invite discipline; counts—not phones or emails | Same rule: admitted keys and revoke at the door—not a door-knock CRM |

**Supporters.** A supporter is someone approved into the Announcements path. The app is a short list of boards, not a social network. They redeem an invite, unlock with biometrics, read org posts, mute noise, and leave with a switch. They never manage keys, relays, or network jargon. Field lists and door-knock databases stay out of this inbox.

**Volunteers.** A volunteer is someone the campaign trusts to *work*—not only to *listen*. Their value is operational: receiving coordination that must not sit on the wide board, discussing under posts once that is enabled, and eventually using freeAB (or a companion surface) as a **volunteer tool** in the same spirit Overlay.html served field volunteers in ABDoorKnock—without importing Overlay’s door-knock GIS / volunteer DB into the supporter inbox. Volunteers need **extra vetting** and a **separate channel** from supporters. That is a hard product rule, not a cosmetic label.

Vetting stays human: offline vouching and invite discipline weed out misaligned intent without turning the app into surveillance. The app enforces the door (who may enter which board); it does not score loyalty or harvest contacts.

---

## 3. Decentralization versus centralization

### What a centralized campaign app usually does

A typical party or advocacy app keeps a server-side account for each person: email or phone, riding, volunteer status, message history, and device tokens. The organization (or its vendor) holds the list. That is convenient for blasting messages and for analytics. It is also a single honeypot: a breach, a subpoena, a hostile staffer, or a change of vendor policy exposes the whole roll. Supporters cannot truly leave without trusting that someone deleted them. The platform operator sits in the middle of every relationship.

### What freeAB.app aims to do instead

Identity starts on the phone. The app creates a cryptographic keypair the user never has to see or type. That key—not an email address—is how the network recognizes “this device is allowed in.” Campaign posts are signed notices placed on **relays** (machines that store and forward signed messages). Phones pull what they have permission to see. Revoking access means dropping that key at the door of a private room, not deleting a row in a CRM you were never supposed to need.

| | Centralized org app | freeAB.app |
| --- | --- | --- |
| Who issues identity? | The organization’s server | The user’s device |
| What does the org hold? | Names, phones, emails, lists | Invite discipline; for private rooms, admitted keys only—not contact details |
| Where do messages live? | Org or vendor database | Relays; private rooms on relays you control |
| Leaving | “Unsubscribe” and hope | Local leave; key removed from private doors |
| Single point of failure | Yes—the membership database | Reduced—no master contact list; private rooms still need your relay(s) |

Decentralization here does **not** mean “no servers at all.” It means the organization is not the **custodian of everyone’s identity and contact book**. Announcement boards can use shared public infrastructure. Sensitive volunteer and strategy boards use relays the movement operates, with invite-only entry.

### Nostr

**Nostr** is an existing open way for apps to do this: each person has a key; apps sign messages; relays store and pass them along. Many public Nostr apps show key management and a big social feed. **freeAB.app would use the same family of ideas, not the same product.** Supporters would see campaign boards and Face ID—not secret phrases, follower lists, or a general social network.

Rough mapping:

- **Public or shared relays** — fine for province-wide Announcements that you already treat as readable by opponents.
- **Your own closed relay** — required for vetted volunteer and strategy rooms (and later threaded discussion there), where only invited keys may read and write.

Commerce and open marketplaces can also speak Nostr (for example classified listings). That is a **separate doorway** if ever pursued: same underlying protocol, different trust rules and likely a different app surface. Political membership and shop identity should not be forced into one list.

### Riding without a personal file

For campaign geography, **riding should be a preference on the phone**, not a field in your database. The app can let someone pick a riding (or suggest one from a postal code lookup that never leaves the device). Posts carry a riding tag or “province-wide.” Each phone filters what to show. You do not store “person X lives in riding Y.” Per-riding *private* rooms would associate keys with a riding on that relay—use that only when fieldwork truly needs a closed door, not for everyone.

---

## 4. What it looks like from three sides

### The supporter (user)

The app looks like a short list of boards, not a social network. No browsing strangers, no follow button, no recovery phrase on the screen.

They receive an invite link or QR code from someone they know. The phone opens the app, asks for Face ID, and they are in. Home is the boards they have leave for—**Announcements** after the first approval tier. Volunteer or strategy rooms appear only after a **second, stronger invite**. Each board is a stack of posts from the organization. They can mute a board. When discussion is enabled on a vetted board, they can open a post and leave a comment. Announcements stay read-only unless the campaign explicitly opens them.

Leaving is a switch. Losing the phone means asking their organizer for a new invite; the old access dies. They never need to know what a relay or a key is.

### The volunteer

Same app family, harder door. A volunteer has already been vouched into the second tier: they see the **separate** Volunteers / Strategy channel(s), not merely a badge on Announcements. Near term (from Stage 2), that means private boards on a closed relay—coordination that must not leak onto the wide list. Longer term, freeAB or a **companion app** should serve as a volunteer work tool in the Overlay sense (field/volunteer support UI and workflows), while keeping Overlay’s door-knock product data and GIS trust model out of the supporter inbox.

Organizers treat volunteer access as revocable work leave: drop the key at the door when someone should no longer coordinate. Counts and board health matter; a harvested volunteer phone book inside freeAB does not.

### The organization (campaign)

Organizers use a simple console (web is enough). They write a post, choose a board, and publish. For Announcements, the signed notice goes out for every phone on that first-tier board. For volunteer / strategy boards, only invited keys on your closed relay receive it.

They issue **invites per board**, not contact lists. An Announcements invite is the first tier. A Volunteers or Strategy invite is a second, named approval—harder to get, tied to offline vouching. They revoke a person by removing access at the door. They see counts—joined, removed, posts sent—not names, phones, or emails. On threads (vetted boards), they can remove a comment or remove the person.

The organization never holds a supporter or volunteer **directory** inside the messaging system. Permission lives on the phone and, for closed boards, as admitted keys on the relay. Vouch notes and “who invited whom,” if kept at all, stay offline with organizers—not in the app database. Door-knock / field volunteer databases remain separate systems with their own trust rules.

### The developer

You ship the supporter-facing app (which later also admits the volunteer boards), a thin organizer console, and at least one relay for closed rooms. Overlay-like volunteer tooling may ship in-app or as a companion surface later; either way it rides the vetted channel, not Announcements.

The app generates a Nostr-compatible key on first launch, stores it in the phone’s secure storage, unlocks it with biometrics, and signs joins and posts without showing cryptography. Invite redemption is how a key gets past the door. Announcement boards may use public relays; volunteer boards use your relay with private, invite-only rules. Optional push notification can wake the phone; the posts themselves still come from relays.

Ongoing work is the client, the console, relay uptime and policy for private rooms, invite and revoke flows (two tiers), then mute, replies on vetted boards, and moderation tools. You do not run a member CRM. You do run the door for private boards.

---

## 5. Staged development plan

Build in order. Each stage should work before the next one starts. Stages 0 and 1 are the supporter Announcements path. Volunteer rooms and Overlay-like tooling come later.

### Stage 0 — Practice with a small group

Start with people you already trust: you as developer, one manager, and two or three users. Run the Stage 0 app in `stage0/`. Practice handing out invites, joining with those invites, posting a test notice, and cutting someone off. Do not collect phone numbers or emails. Offline vouching among about fifteen known people is enough to prove the door. If the manager will not cut access in this drill, later stages will not fix that habit.

Stage 0 is the **supporter / Announcements** drill on a simple shared pilot server. A `volunteers` label may exist in code as a placeholder for later invites; **do not treat Stage 0 as shipping the vetted volunteer channel or Overlay-like tooling.** Phones holding their own keys, and the Nostr-style board network, start in Stage 1.

### Stage 1 — First real notice board

Supporters open the app, unlock with Face ID or a fingerprint, and join with a one-time invite from someone they know. The campaign posts **read-only Announcements**. Supporters read them and can leave. The campaign never receives a phone number or email. The phone keeps a private key in the background so people never manage passwords or secret phrases. Success looks like this: people still open the app weeks later.

Volunteer private rooms and field-tool surfaces are **out of Stage 1**—named here so the first real app does not pretend to be both tiers at once.

### Stage 2 — Private rooms for volunteers

Add boards that are not for everyone—**Volunteers** and **Strategy**. Those rooms run on a server you control. Only people with the **second invite tier** (stronger vouch / named approval) get in. If someone should leave, you remove them at the door. Announcements stay the wider path. Volunteer rooms stay locked and separate.

This is the first stage where the volunteer role is real in the product: a distinct channel, not a label on the supporter feed.

### Stage 3 — Mute

Before people can reply, give everyone a quiet button. A person can mute a board, a person, or a conversation. Organizers can mute or ban someone from a board. That keeps the app usable as the group grows.

### Stage 4 — Comments under a post

On **private / volunteer** boards, allow comments under an official post. Keep it to one level at first: replies to the post, not long nested debates. Only the second invite tier may talk back. Organizers can take a comment down. The main Announcement board stays read-only so it does not become an open forum. Riding can be a choice on the phone (“show me my area”) without storing “this person lives in that riding” on your servers.

### Stage 5 — Make it reliable

Send a gentle nudge when something new is posted, so people do not have to remember to check. Now and then ask them to confirm they still want the messages. Keep a backup so a private room does not die if one machine fails. Make invite levels clear: easier to get Announcements; harder to get into volunteer discussion rooms.

### Stage 6 — Grow with care; volunteer tooling

Add more organizers. Cap how many invites each person may hand out. Give trusted people moderation jobs. Keep the app about campaign boards and trusted talk.

**Longer-term volunteer tool:** extend freeAB or ship a companion app so vetted volunteers have Overlay-like field support (workflows suited to doing the work)—still on the vetted channel, still without folding door-knock GIS / APP volunteer databases into the supporter Announcements path. Companion vs in-app is an implementation choice; the trust boundary is not.

If shops or buying and selling ever use the same underlying technology, that should be a separate door—not mixed into political membership.

---

## 6. Non-negotiables

1. **User sovereignty** — People decide which boards may reach them and can leave at any time.
2. **No contact disclosure** — Campaigns do not receive email addresses, phone numbers, or a harvested supporter/volunteer list from this messaging system.
3. **Decentralized identity** — Keys are created and held on the device; the org does not mint centralized accounts tied to personal contact data.
4. **Practical usability** — Cryptographic detail stays off the screen; Face ID and invites carry the experience.
5. **Compartmentation** — Announcements are assumed readable by opponents; volunteer and strategy coordination stay behind a stronger door and a separate channel.
6. **Vetting stays human** — Alignment is confirmed by vouching and tiered invites, not by the app scoring loyalty.
7. **Two doors** — Supporters and volunteers are different trust tiers; volunteer access needs extra vetting and must not share the supporter Announcements channel.

---

## 7. Related reading

- `docs/secure_user_controlled_messenger_for_campaigns.md` — earlier conceptual summary of user-controlled campaign messaging (when present).
- ABDoorKnock Overlay (`distribution/APP_volunteer_support/overlay.html` and related) — visual and longer-term *volunteer tool* analogy only; do not copy the door-knock product into freeAB.

---

*This document is for discussion and planning. It is not legal advice and not a commitment to a specific vendor, domain, or ship date.*
