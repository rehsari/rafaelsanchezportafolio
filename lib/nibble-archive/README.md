# NibbleLM Archive

This folder preserves the original ("full") version of NibbleLM's system
prompt. It is the canonical record of the assistant's intended behavior in
its most explicit, unabbreviated form.

`lib/projects.js` (PROJECTS_BRAIN) remains the canonical source of truth for
all project facts and is **not** archived here — it is still live and still
complete. Nothing about Rafael's work has been summarized away.

## Current architecture (replaces the old Groq TPM trim)

The earlier version of this README described a trimmed prompt built to fit
Groq's free-tier 8000 TPM cap. That situation is gone. The app runs on
OpenRouter (`openai/gpt-oss-120b`) and the constraint is now **latency**, not
a token cap.

Production no longer sends the whole portfolio on every request:

| Piece | File | Sent |
|---|---|---|
| `SYSTEM_PROMPT_V3` | `lib/nibble-prompt.js` | always (stable, cacheable) |
| `PROJECT_INDEX` | `lib/nibble-context.js` | always (~1.6k tokens, all projects) |
| `PROJECT_DETAILS` | `lib/nibble-context.js` | only the 0-2 projects a request needs |
| `SYSTEM_PROMPT_FULL_V2` | here | never — reference only |
| `PROJECTS_BRAIN` | `lib/projects.js` | never sent raw; both representations derive from it |

Average input dropped from ~11,500 tokens per request to ~3,200.

## Why v2 is still here

`SYSTEM_PROMPT_FULL_V2` is the long-form statement of Nibble's rules. v3 is a
compression of it, not a replacement of intent: identity, grounding, capability
language, project matching, voice, humor, security boundary, never-discuss
list and the open_project brief all survive. If a behavior in v3 ever reads as
ambiguous, v2 is the reference for what was meant.

Two things in v2 were deliberately **not** carried into v3:

1. **The UX/product/interaction design skill taxonomy** (~120 lines). GPT-OSS-120B
   already knows this vocabulary, so the section was paying ~1,500 tokens per
   request to teach the model words it has. v3 replaces it with a single
   instruction to use precise industry language only where the data supports it.
2. **Repetition.** v2 stated several rules two or three times in different
   sections. Each now appears once.

## Important

- Nothing here is loaded at runtime. It is a plain source archive.
- If you change voice or rules in `lib/nibble-prompt.js`, consider updating
  this file too, so the long-form record doesn't drift from the live behavior.
- Not a place for secrets or API keys.

## Files

- `README.md` — this file
- `system-prompt-full.js` — the full v2 system prompt, preserved verbatim
