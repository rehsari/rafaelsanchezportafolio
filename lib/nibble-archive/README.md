# NibbleLM Archive

This folder preserves the original ("full") versions of NibbleLM's system
prompt, brain projection, and history window. They exist so the trimmed
version currently running in production can be reverted cleanly once
Groq's Dev Tier is available again (or usage moves elsewhere).

## Why the trim exists

Groq's free-tier `on_demand` service has an **8000 token-per-minute
(TPM) cap per organization**, shared across all models. The original
("full") system prompt + full brain projection + user message ran ~5000
to 6000 tokens per request, which meant visitors could only send one
message per minute before hitting a 429 rate limit.

Groq's Dev Tier removes that cap and costs cents per month at portfolio
traffic, but on 2026-08-21 Dev Tier upgrades were paused ("temporarily
unavailable due to high demand"). Rather than leave NibbleLM broken in
production, the prompt and brain projection were trimmed to fit the
free tier.

## What changed

Every trim site in `api/chat.js` is marked with a `[NIBBLE_TRIM]`
comment. Search the repo for that tag to find every edit.

1. **`api/chat.js` — `SYSTEM_PROMPT` constant**
   Full v2 preserved in `system-prompt-full.js` below. Running v3 is a
   compressed rewrite of the same rules (identity, grounding, capability
   claims, security boundary, response procedure, project matching,
   tool use, conversational rhythm, curatorial judgment, context
   awareness, availability, voice, quirks, humor, selling without
   selling, never-discuss list, edge case examples, format). Same rules,
   fewer words.

2. **`api/chat.js` — `compactBrain()`**
   Was already dropping token-heavy fields. Trim added: also drops
   `approach` and `outcomes` from what's sent to the model. Full brain
   in `lib/projects.js` is untouched.

3. **`api/chat.js` — history slice**
   Changed from `messages.slice(-12)` to `messages.slice(-6)`. Model
   now sees the last 3 back-and-forths instead of 6.

## How to revert (no conversation context needed)

When you regain headroom (Dev Tier upgrade, model change, tier change):

1. Open `api/chat.js`. Search for `[NIBBLE_TRIM]`.
2. At each hit, the comment lists what the trimmed version does and
   what to restore. Follow the instructions inline.
3. For the system prompt specifically:
   - Delete the current `SYSTEM_PROMPT` constant block.
   - `import { SYSTEM_PROMPT_FULL_V2 } from '../lib/nibble-archive/system-prompt-full.js';`
   - Rename the imported constant to `SYSTEM_PROMPT` at the reference
     site, OR change every reference in the file from `SYSTEM_PROMPT`
     to `SYSTEM_PROMPT_FULL_V2`.
4. For `compactBrain`: uncomment the fields marked `[NIBBLE_TRIM]`.
5. For history slice: change `.slice(-6)` back to `.slice(-12)`.
6. Delete this archive folder if you want, or keep it as reference.

## What this archive is NOT

- Not a fallback loaded at runtime. Nothing imports from here in the
  trimmed version. It is a plain source-code archive so it lives in
  git history.
- Not a place to store secrets or API keys.
- Not automatically kept in sync. If you edit voice/rules in the live
  `SYSTEM_PROMPT`, update `system-prompt-full.js` too, or the revert
  will overwrite recent improvements.

## Files in this folder

- `README.md` — this file
- `system-prompt-full.js` — the full v2 system prompt preserved verbatim
