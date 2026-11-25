# freeAB.app — Concept and Staged Development Plan

*A decentralized notice board and discussion layer for the Alberta independence movement.*

---

## 1. Introduction

**freeAB.app** is a proposed mobile-friendly application that lets a campaign speak to supporters—and lets supporters follow and, where appropriate, discuss—without handing the organization a traditional contact list.

Supporters join with a one-time invite from someone they trust. They unlock the app with Face ID or a fingerprint. They see boards (for example Announcements, and later private volunteer or strategy rooms). The campaign posts notices. On vetted boards, people may eventually comment under those posts. Anyone can leave. Organizers can revoke access. The organization does **not** receive phone numbers, email addresses, or a permanent registry of who is who.

The name **freeAB.app** is the product and the site. It reflects the political aim (a free Alberta). The technical aim is simpler: **permission without possession**—the campaign may reach people who have given leave, without owning their contact details.

---

## 2. Decentralization versus centralization

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

Decentralization here does **not** mean “no servers at all.” It means the organization is not the **custodian of everyone’s identity and contact book**. Announcement boards can use shared public infrastructure. Sensitive boards use relays the movement operates, with invite-only entry.

### Nostr, in plain language

**Nostr** is an existing open protocol for this pattern: people have keys; apps sign messages; relays store and pass them along. Many public Nostr apps (such as social clients) expose key management and a global social feed. **freeAB.app would use the same family of ideas, not the same product experience.** Supporters would see campaign boards and Face ID—not seed phrases, follower graphs, or a general social network.

Rough mapping:

- **Public or shared relays** — fine for province-wide announcements that you already treat as readable by opponents.
- **Your own closed relay** — required for vetted rooms (volunteers, strategy, threaded discussion), where only invited keys may read and write.

Commerce and open marketplaces can also speak Nostr (for example classified listings). That is a **separate doorway** if ever pursued: same underlying protocol, different trust rules and likely a different app surface. Political membership and shop identity should not be forced into one list.

### Riding without a personal file

For campaign geography, **riding should be a preference on the phone**, not a field in your database. The app can let someone pick a riding (or suggest one from a postal code lookup that never leaves the device). Posts carry a riding tag or “province-wide.” Each phone filters what to show. You do not store “person X lives in riding Y.” Per-riding *private* rooms would associate keys with a riding on that relay—use that only when fieldwork truly needs a closed door, not for everyone.

---

## 3. What it looks like from three sides

### The supporter (user)

The app looks like a short list of boards, not a social network. No browsing strangers, no follow button, no recovery phrase on the screen.

They receive an invite link or QR code from someone they know. The phone opens the app, asks for Face ID, and they are in. Home is the boards they have leave for—Announcements for those approved into the wide channel; other rooms only after a stronger invite. Each board is a stack of posts from the organization. They can mute a board. When discussion is enabled on a board, they can open a post and leave a comment.

Leaving is a switch. Losing the phone means asking their organizer for a new invite; the old access dies. They never need to know what a relay or a key is.

### The organization (campaign)

Organizers use a simple console (web is enough). They write a post, choose a board, and publish. For Announcements, the signed notice goes out for every phone that follows that board. For private boards, only invited keys on your closed relay receive it.

They issue **invites**, not contact lists. An invite is single-use and tied to a board (and, offline, to whoever vouched). They revoke a person by removing access at the door. They see counts—joined, removed, posts sent—not names, phones, or emails. On threads, they can remove a comment or remove the person.

The organization never holds a supporter directory inside the messaging system. Permission lives on the phone and, for closed boards, as admitted keys on the relay. Vouch notes and “who invited whom,” if kept at all, stay offline with organizers—not in the app database.

### The developer

You ship the supporter app, a thin organizer console, and at least one relay for closed rooms.

The app generates a Nostr-compatible key on first launch, stores it in the phone’s secure storage, unlocks it with biometrics, and signs joins and posts without showing cryptography. Invite redemption is how a key gets past the door. Announcement boards may use public relays; vetted boards use your relay with private, invite-only rules. Optional push notification can wake the phone; the posts themselves still come from relays.

Ongoing work is the client, the console, relay uptime and policy for private rooms, invite and revoke flows, then mute, replies, and moderation tools. You do not run a member CRM. You do run the door for private boards.

---

## 4. Staged development plan

Plain-language stages from first discipline to a dependable campaign tool.

### Stage 0 — Start with people (multiuser invite drill)

Begin with a small circle you already trust: one developer, one manager, a few users. Run the Stage 0 app under `freeab/stage0` to practice issuing invites, redeeming them, posting a practice notice, and revoking access—without collecting phone numbers or emails. If organizers will not revoke in this drill, later stages will not save you. This stage still uses a simple shared server for the pilot; device-held keys and Nostr relays begin in Stage 1.

### Stage 1 — A simple notice board (first real app)

Supporters install the app, unlock it with Face ID (or a fingerprint), and join with a one-time invite from someone they know. The campaign posts announcements. Supporters read them. They can leave. The campaign never gets their phone number or email. Behind the scenes the phone keeps a private key so the person does not have to manage passwords or recovery phrases. Goal: people still bother to open it after a few weeks.

### Stage 2 — Private rooms for serious work

Add boards that are not for everyone—volunteer coordination, strategy, and the like. Those rooms sit on a server you control that only lets invited people in. If someone should no longer be there, you remove their access at the door. The wide announcement board can stay more open; the private rooms stay locked.

### Stage 3 — Quiet controls (mute)

Before people can talk back, give everyone a way to cut the noise. A supporter can mute a whole board, a person, or a conversation. Organizers can mute or ban someone from a board. This keeps the app usable when the group grows.

### Stage 4 — Conversation under a post

On the private boards, allow comments under an official post—one level of replies at first (comments on the post, not endless nested arguments). Organizers can take down a comment. The main announcement board can stay read-only so it does not turn into a free-for-all. Riding can work as a preference on the phone (“show me my area”) without you storing “this person lives in that riding.”

### Stage 5 — Make it dependable

Add gentle reminders when something new is posted (so people do not have to remember to check). Every so often ask people to confirm they still want the messages. Keep a backup path so a private room does not die if one machine fails. Make invite levels obvious: easy to get announcements; harder to get into discussion rooms.

### Stage 6 — Grow the movement carefully

Add more organizers, limit how many invites each person can hand out, and give trusted people moderation jobs. Keep the app about campaign boards and trusted discussion. If shops or commerce ever use the same underlying technology, that should be a separate doorway—not mixed into the political membership list.

---

## 5. Non-negotiables

1. **User sovereignty** — Supporters decide which boards may reach them and can leave at any time.
2. **No contact disclosure** — Campaigns do not receive email addresses, phone numbers, or a harvested supporter list from this system.
3. **Decentralized identity** — Keys are created and held on the device; the org does not mint centralized accounts tied to personal contact data.
4. **Practical usability** — Cryptographic detail stays off the screen; Face ID and invites carry the experience.
5. **Compartmentation** — Wide announcements are assumed readable by opponents; strategy and volunteer coordination stay behind a stronger door.
6. **Vetting stays human** — Alignment is confirmed by vouching and invites, not by the app scoring loyalty.

---

## 6. Related reading

- `docs/secure_user_controlled_messenger_for_campaigns.md` — earlier conceptual summary of user-controlled campaign messaging.

---

*This document is for discussion and planning. It is not legal advice and not a commitment to a specific vendor, domain, or ship date.*
