# JomPaktor

A senior‑friendly dating and friendship demo app. Adults 55+ can sign up
with their voice, get a profile auto‑filled from what they say, swipe
through nearby matches on a map‑aware deck, chat with a built‑in scam
checker, and have any text on the screen read aloud in their language.

> **Note:** This is a single-page Next.js demo. There is no real backend or
> database — all accounts, profiles, swipes, chats, and approvals live in
> the browser's `localStorage`. Treat it as a prototype, not a production
> dating service.

---

## Table of contents

1. [Quick start](#quick-start)
2. [Environment variables](#environment-variables)
3. [Feature tour](#feature-tour)
4. [Project structure](#project-structure)
5. [How things work](#how-things-work)
   - [Authentication](#authentication)
   - [Voice answer extraction](#voice-answer-extraction)
   - [Match deck](#match-deck)
   - [Scam detection](#scam-detection)
   - [Read aloud / voice typing](#read-aloud--voice-typing)
6. [Where data lives](#where-data-lives)
7. [Scripts](#scripts)
8. [Troubleshooting](#troubleshooting)
9. [Tech stack](#tech-stack)

---

## Quick start

**Prerequisites**

- Node.js 20+
- npm (bundled with Node)
- Optional API keys (see [Environment variables](#environment-variables))
  if you want voice, AI bios, AI avatars, or map geocoding to work.

**Install and run**

```bash
git clone <this repo>
cd silver-sparks
npm install
cp .env.local.example .env.local  # if a sample exists; otherwise create one
npm run dev
```

Open <http://localhost:3000>.

The app works without any API keys — voice prompts, STT (speech-to-text),
TTS (text-to-speech), AI bio generation, AI avatars, and city geocoding
will simply degrade or no-op when their keys are missing. Every other
feature (signup, swipe, chat, scam checker, profile, onboarding) works
purely client-side.

---

## Environment variables

Create `.env.local` at the repo root and add only the keys you need.

| Variable                            | Used by                                         | Required for                              |
|-------------------------------------|-------------------------------------------------|-------------------------------------------|
| `ELEVENLABS_API_KEY`                | `/api/elevenlabs/tts`, `/api/elevenlabs/stt`    | Read-aloud TTS and voice-typing STT       |
| `ELEVENLABS_VOICE_ID`               | `/api/elevenlabs/tts` (default: Bella)          | Override the TTS voice                    |
| `ELEVENLABS_MODEL_ID`               | `/api/elevenlabs/tts` (default: `eleven_v3`)    | Override the TTS model                    |
| `ELEVENLABS_OUTPUT_FORMAT`          | `/api/elevenlabs/tts` (default: `mp3_44100_128`)| Override audio format                     |
| `ELEVENLABS_STT_MODEL_ID`           | `/api/elevenlabs/stt` (default: `scribe_v2`)    | Override the STT model                    |
| `OPENAI_API_KEY`                    | `/api/openai/bio`, `/api/openai/avatar`         | "Write my about-me" and 3D avatar         |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`   | Profile city ↔ map sync, location picker        | Map view + automatic city → lat/lng       |

If a key is missing, the relevant API route returns a 500 with a clear
`error` message and the UI stays calm — onboarding can still be completed
with text input only.

---

## Feature tour

### Welcome and accounts

- `/` shows a welcome card with **Sign up with email** and **Log in** when
  no one is signed in, and the **Match deck** when someone is.
- `/signup` requires a real email (must contain `@` plus a domain) and a
  password ≥ 8 characters with confirmation. Show/hide toggle is provided
  for both fields.
- `/login` validates the same email rules and returns a generic error on
  bad password to avoid leaking which emails exist.
- A **Log out** button is in the top nav (and on `/profile`) for the
  signed-in user.

### Onboarding (4 steps)

1. **`/onboarding/language`** — choose the language for prompts and
   read-aloud (English, Spanish, Chinese, Tagalog, Vietnamese).
2. **`/onboarding/voice/[step]`** — answer two short prompts by speaking.
   The mic stops automatically on silence. The transcript is shown so the
   user can edit it. **Smart extraction** turns "My name is Peter" into
   just `Peter` and previews exactly what will be saved before you
   continue (see [Voice answer extraction](#voice-answer-extraction)).
3. **`/onboarding/selfie`** — upload or take a photo. Optionally generate
   a "Pixar-style" avatar via the `OPENAI_API_KEY` route.
4. **`/onboarding/profile`** — review and edit name, age, city (with map
   pin), about-me (auto-written from voice answers if you opted in), and
   match preferences (radius, age range, gender preferences).
   Finishing this step marks the profile as onboarded.

### Matches tab (`/`)

- A swipeable card deck ranked **closest first** within the user's
  preference filters (radius, age range, gender preferences).
- **Right-swipe** = like (creates a chat thread under Chats).
- **Left-swipe** = pass.
- **Decisions persist**: liked and passed match ids are saved to the
  user's profile, so cards never reappear after a refresh.
- The **Safety reminder** card sits at the top and warns about money/
  urgency/secrecy — the same things the scam checker watches for in chat.

### Chats tab (`/chats`)

- Lists the people you've right-swiped on, with an **Open chat** button.
- An empty state nudges users back to the Matches tab.

### Chat (`/chat/[id]`)

- **Messenger/WhatsApp-style bubbles**: their messages on the left, yours
  on the right, with a sender label above each new incoming series, time
  and a **Read aloud** link below each bubble.
- **Voice typing**: a microphone button transcribes speech into the reply
  draft via ElevenLabs STT.
- **Scam checker**: every message is run through a structured heuristic.
  Any flagged bubble gets an inline rose (high) or amber (medium) badge
  listing exactly which categories tripped and the offending phrase. A
  high-risk message pauses the reply box until a moderator approves _that
  specific message_. New scam messages can re-pause the chat even after
  past approvals (see [Scam detection](#scam-detection)).

### Profile tab (`/profile`)

- Shows the avatar/photo, name, age, city, bio, interests, signed-in
  email, **Edit profile**, **Log out**, and a destructive **Clear local
  profile** that wipes the current account's profile data.
- `/profile/edit` lets users update the same fields and pin location.

---

## Project structure

```
src/
├─ app/                     # Next.js App Router pages
│  ├─ layout.tsx            # Root layout, fonts
│  ├─ page.tsx              # Welcome + Match deck
│  ├─ signup/page.tsx       # Real email + password signup
│  ├─ login/page.tsx        # Real email + password login
│  ├─ onboarding/
│  │  ├─ language/page.tsx
│  │  ├─ voice/[step]/page.tsx   # Voice prompts + smart extraction
│  │  ├─ selfie/page.tsx
│  │  ├─ profile/page.tsx        # Review + finish
│  │  └─ done/page.tsx
│  ├─ chats/page.tsx        # Liked-list with Open chat
│  ├─ chat/[id]/page.tsx    # Chat room with scam checker
│  ├─ profile/page.tsx
│  ├─ profile/edit/page.tsx
│  └─ api/
│     ├─ elevenlabs/tts/route.ts
│     ├─ elevenlabs/stt/route.ts
│     ├─ openai/bio/route.ts
│     └─ openai/avatar/route.ts
├─ components/
│  ├─ AppShell.tsx          # Sticky nav (Matches / Chats / Profile),
│  │                          page title, footer, log in/out controls
│  ├─ LocationMapSection.tsx
│  ├─ VoiceModeToggle.tsx   # "Read this page aloud" toggle
│  └─ ui/                   # PrimaryButton, Card, Pill, ProgressDots,
│                             SwipeableMatchCard, BottomBarCTA
├─ hooks/
│  ├─ useTtsPlayer.ts       # Plays text via the TTS route
│  └─ useSilenceStopRecorder.ts  # Auto-stops mic after a pause
└─ lib/
   ├─ auth.ts               # localStorage accounts + session
   ├─ localProfile.ts       # Per-account profile + helpers
   ├─ matchRanking.ts       # Filter + closest-first sort
   ├─ sampleData.ts         # Demo matches and seeded chats
   ├─ safety.ts             # Structured scam heuristic
   ├─ voiceExtract.ts       # "My name is Peter" → "Peter"
   ├─ voicePrefs.ts         # TTS playback prefs
   └─ geo.ts                # Haversine + Google geocoding
```

---

## How things work

### Authentication

`src/lib/auth.ts`

- Accounts are stored at `silverSparks.accounts.v1` as
  `{ email, passwordHash, salt, createdAtIso }`.
- Passwords are stored as **salted SHA-256** computed in the browser via
  `crypto.subtle.digest`. Each account gets a fresh 16-byte random salt.
- The current session is stored at `silverSparks.session.v1` as
  `{ email }`.
- `signUp(email, password)` validates email (`@` plus domain) and password
  (≥ 8 chars), then writes a new account and signs the user in.
- `logIn(email, password)` returns a generic mismatch error on bad
  password — it does not reveal whether the email exists.
- `logOut()` clears the session.
- On the very first signup, any pre-existing `silverSparks.userProfile.v1`
  (from the older single-user version of the demo) is migrated under the
  new account so existing users don't lose progress.

> **Demo only.** Browser-side password hashing is *not* a substitute for
> server-side auth. Anyone with access to the browser can read every
> account's salt and hash. Don't ship this against real users.

### Voice answer extraction

`src/lib/voiceExtract.ts`

The voice onboarding step always shows the full transcript so the user
can verify exactly what was heard. For prompts that auto-fill structured
profile fields (currently the name prompt), a small deterministic parser
strips common prefixes and casual fillers so we save the user's *name*,
not their whole sentence.

Examples:

| Said                            | Saved name        |
|---------------------------------|-------------------|
| "My name is Peter"              | `Peter`           |
| "Hi, I'm Peter Johnson"         | `Peter Johnson`   |
| "Just call me Pete, please"     | `Pete`            |
| "Peter"                         | `Peter`           |
| "they call me grandma jo"       | `Grandma Jo`      |
| "Um, my name is Peter"          | `Peter`           |
| "Me llamo Pedro"                | `Pedro`           |
| "Je m'appelle Marie"            | `Marie`           |

The voice page shows a live preview ("We'll save your name as: **Peter**")
underneath the transcript whenever the cleaned value differs from the raw
text, so seniors always see exactly what the form will receive. The raw
sentence is also kept under `voiceAnswers.<id>_raw` for traceability.

Free-form prompts (e.g. "perfect Sunday afternoon") are stored verbatim.

### Match deck

`src/app/page.tsx`, `src/lib/matchRanking.ts`

- Matches come from the seeded `sampleMatches` in `src/lib/sampleData.ts`.
- The deck is filtered by `ageRange`, `genderPrefs`, and `matchRadius`,
  then sorted closest first using a haversine distance.
- Both **liked** and **passed** ids are stored on the profile
  (`likedMatchIds`, `passedMatchIds`). On every page load the deck filters
  these out, so decided cards do not reappear.
- Right-swipe creates a chat row in the Chats tab.
- Clearing the local profile (or signing up a fresh account) resets all
  decisions for that account.

### Scam detection

`src/lib/safety.ts`, `src/app/chat/[id]/page.tsx`

- A structured heuristic, `localHeuristicSafetyCheck(text)`, runs on every
  message and returns:
  - `level`: `"low" | "medium" | "high"`
  - `reasons`: an array of `{ category, label, match }` so the UI can
    show *which* phrase tripped *which* category.
- Categories: **money**, **urgency**, **off_platform**, **isolation**,
  **credentials**.
- Smoking-gun phrases (e.g. `wire transfer`, `gift card`, `WhatsApp`,
  `keep it secret`, `bank account`, `OTP`, `account number`) escalate the
  level. Multiple categories combined go straight to `high`.
- Each flagged message in the chat gets an **inline badge** under the
  bubble listing the matched terms, regardless of moderator state.
- A high-risk unapproved message **locks the reply box** with a rose
  review card.
- Moderator approval is **per-message id**, stored at
  `silverSparks.moderatorApprovedMessages.v1`. This means a fresh scam
  message later can re-lock the chat even after older messages were
  cleared — unlike a per-chat allowlist that would silence detection
  forever.

Worked example (Maya's seeded message):

> "Urgent — I need a wire transfer today. Message me on WhatsApp, keep it
> secret."

returns `level: "high"` with reasons in money, urgency, off_platform, and
isolation. The bubble paints rose, the inline badge lists each matched
phrase, and the reply box pauses until that message is approved.

### Read aloud / voice typing

- `useTtsPlayer(language)` (in `src/hooks/useTtsPlayer.ts`) calls
  `/api/elevenlabs/tts` and plays the returned audio. Used by the
  per-message "Read aloud" link, the page-level toggle in `AppShell`, and
  some onboarding cards.
- `useSilenceStopRecorder` (in `src/hooks/useSilenceStopRecorder.ts`)
  watches mic input and triggers a callback after a quiet period — used
  during voice onboarding so seniors don't have to find a Stop button.
- Voice typing in chat uses the same STT route, posting the recorded blob
  as `multipart/form-data` to `/api/elevenlabs/stt`.

---

## Where data lives

Everything is stored in `localStorage` on the user's device. There is no
server-side persistence.

| Key                                              | What                                  |
|--------------------------------------------------|---------------------------------------|
| `silverSparks.accounts.v1`                       | Array of `{email, passwordHash, salt, createdAtIso}` |
| `silverSparks.session.v1`                        | Currently signed-in `{email}`         |
| `silverSparks.profile.<email>`                   | The full `UserProfile` for that email |
| `silverSparks.userProfile.v1`                    | Legacy single-user profile (migrated to first account on signup) |
| `silverSparks.moderatorApprovedMessages.v1`      | Set of approved scam-message ids      |

Clearing site data in your browser resets the entire app.

---

## Scripts

```bash
npm run dev     # Next.js dev server with hot reload
npm run build   # Production build
npm run start   # Start the production build
npm run lint    # ESLint
```

---

## Troubleshooting

- **"Microphone permission is required."** Voice onboarding and chat
  voice-typing need mic access. In Chrome/Safari, click the camera/mic
  icon in the address bar and allow microphone for `http://localhost:3000`.
- **"Missing ELEVENLABS_API_KEY."** Add it to `.env.local` and restart
  `npm run dev`. Read-aloud and voice-typing will be disabled until set.
- **Map shows nothing or city won't sync.** Add
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env.local`. Without it the map
  hides itself and the city field still saves but doesn't auto-pin.
- **"Write my about-me" does nothing.** That requires `OPENAI_API_KEY`.
- **Cards I already passed keep showing up.** This was a bug fixed by
  persisting `passedMatchIds` on the profile — make sure you're on the
  current build and not viewing a stale tab.
- **Can't log in on a different browser/device.** Accounts are stored in
  this browser's `localStorage` only. Sign up again on each device — this
  is a demo, not a synced backend.
- **A previously approved scam chat is now flagged again.** Approval is
  per-message id, so a *new* high-risk message will re-lock the chat
  until that specific message is approved. This is intentional.

---

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- [framer-motion](https://www.framer.com/motion/) for the swipeable cards
- [ElevenLabs](https://elevenlabs.io) for TTS / STT (optional)
- [OpenAI](https://platform.openai.com) for bio + avatar generation (optional)
- [Google Maps JavaScript API](https://developers.google.com/maps) for the
  location picker (optional)
