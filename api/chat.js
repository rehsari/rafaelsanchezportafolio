/* ═══════════════════════════════════════════════════════════════════════════
   NIBBLE-LM CHAT ENDPOINT
   Vercel Edge function. Takes visitor messages + page context, routes the
   smallest relevant slice of the portfolio into the prompt, calls OpenRouter,
   and streams the answer back as SSE. Rate-limited via Upstash.

   Latency architecture (see lib/nibble-context.js for the routing rationale):
   - Only the relevant project detail is sent, not the whole brain.
   - Stable content goes first so the prompt prefix stays cacheable.
   - Reasoning effort is low; Nibble answers retrieval questions, not puzzles.
   - Provider routing is throughput-sorted.
   - The response streams, so the visitor sees words instead of a spinner.

   Set NIBBLE_DEBUG=1 to log the latency/token breakdown to the server log.
   Diagnostics are never sent to the browser.
═══════════════════════════════════════════════════════════════════════════ */

import { PROJECTS_BRAIN, PROJECT_IDS } from '../lib/projects.js';
import { SYSTEM_PROMPT_V3 } from '../lib/nibble-prompt.js';
import {
  routeContext,
  buildContextMessage,
  wantsDetail,
  estimateTokens,
} from '../lib/nibble-context.js';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const config = { runtime: 'edge' };

/* Rate limiter is optional. If Upstash env vars aren't set (or use different
   names on this Vercel account), NibbleLM still works, just without a cap. */
let ratelimit = null;
try {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.REDIS_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.REDIS_TOKEN;
  if (url && token) {
    ratelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(200, '1 h'),
      analytics: false,
    });
  }
} catch (e) {
  console.error('NibbleLM: rate limiter init failed, continuing without limits:', e);
  ratelimit = null;
}

const MODEL = 'openai/gpt-oss-120b';
const DEBUG = process.env.NIBBLE_DEBUG === '1';

/* Recent turns kept verbatim. Older turns collapse into a one-line digest so
   a long session stops growing the request instead of growing it forever. */
const KEEP_TURNS = 6;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'open_project',
      description:
        'Open a specific project modal on the portfolio. Call this when the visitor asks to see, open, or learn more about a specific project, or when you are confident a specific project is what they should look at next.',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            enum: PROJECT_IDS,
            description: 'The slug of the project to open.',
          },
        },
        required: ['project_id'],
      },
    },
  },
];

const TITLES = new Map(PROJECTS_BRAIN.map((p) => [p.id, p.title]));

/* Deterministic history compaction. No extra model call: older turns are
   reduced to the list of projects they covered, which is the only thing later
   turns need in order to resolve a reference. */
function prepareHistory(messages) {
  const clean = messages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content.slice(0, 2000),
    }));

  if (clean.length <= KEEP_TURNS) return { history: clean, digest: null };

  const older = clean.slice(0, -KEEP_TURNS);
  const recent = clean.slice(-KEEP_TURNS);
  const seen = [];
  for (const m of older) {
    for (const id of PROJECT_IDS) {
      if (!seen.includes(id) && m.content.toLowerCase().includes(id)) seen.push(id);
    }
  }
  const digest = seen.length
    ? `Earlier in this conversation you already covered: ${seen
        .map((id) => TITLES.get(id) || id)
        .join(', ')}.`
    : null;
  return { history: recent, digest };
}

export default async function handler(req) {
  const t0 = Date.now();
  const mark = {};

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'anonymous';

  if (ratelimit) {
    try {
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return json(
          { error: 'Rate limit reached. NibbleLM needs a coffee. Try again in a bit.' },
          429
        );
      }
    } catch (e) {
      console.error('Rate limit check failed:', e); // fail open
    }
  }
  mark.ratelimit = Date.now() - t0;

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { messages, pageContext } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'messages array is required' }, 400);
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return json({ error: 'Server missing OPENROUTER_API_KEY' }, 500);

  /* ── Context routing ─────────────────────────────────────────────────── */
  const { history, digest } = prepareHistory(messages);
  const route = routeContext({ messages: history, pageContext });
  const contextText = buildContextMessage(route, pageContext);
  mark.routed = Date.now() - t0;

  /* Stable first, dynamic last, so the cacheable prefix is as long as
     possible: system prompt never changes, context changes only by route. */
  const payloadMessages = [
    { role: 'system', content: SYSTEM_PROMPT_V3 },
    { role: 'system', content: contextText },
    ...(digest ? [{ role: 'system', content: digest }] : []),
    ...history,
  ];

  const latest = history[history.length - 1]?.content || '';
  const maxTokens = wantsDetail(latest) ? 700 : 320;

  const tokens = {
    system: estimateTokens(SYSTEM_PROMPT_V3),
    context: estimateTokens(contextText),
    history: estimateTokens(history.map((m) => m.content).join(' ')),
  };
  tokens.total = tokens.system + tokens.context + tokens.history;
  mark.builtContext = Date.now() - t0;

  let upstream;
  try {
    upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://www.rafaelsanchez.design',
        'X-Title': 'NibbleLM',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: payloadMessages,
        tools: TOOLS,
        tool_choice: 'auto',
        temperature: 0.6,
        max_tokens: maxTokens,
        stream: true,
        /* gpt-oss-120b is a reasoning model. Nibble does grounded retrieval and
           short curatorial writing, so deep reasoning buys nothing and costs
           seconds of pre-answer tokens. Low keeps matching quality intact. */
        reasoning: { effort: 'low', exclude: true },
        /* Prefer the fastest provider serving this model, but keep fallbacks
           so a single slow or down provider can't break the assistant. */
        provider: { sort: 'throughput', allow_fallbacks: true },
      }),
    });
  } catch (e) {
    console.error('OpenRouter request failed:', e);
    return json({ error: 'NibbleLM had trouble thinking. Try again in a moment.' }, 502);
  }
  mark.upstreamHeaders = Date.now() - t0;

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    console.error('OpenRouter error:', upstream.status, detail);
    return json({ error: 'NibbleLM had trouble thinking. Try again in a moment.' }, 502);
  }

  /* ── Stream translation ────────────────────────────────────────────────
     OpenRouter SSE in, a small typed event protocol out:
       {t:"delta", v:"..."}  text to render as it arrives
       {t:"tool",  ...}      resolved open_project call
       {t:"error", ...}      upstream died mid-stream
       {t:"done"}            end of turn                                    */

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      let buffer = '';
      let fullText = '';
      let firstTokenAt = null;
      let provider = null;
      let usage = null;

      /* Accumulates streamed tool_call argument fragments by index. */
      const toolParts = new Map();
      let leakedId = null;

      /* gpt-oss occasionally emits its intended tool call as a raw JSON blob in
         the content instead of using tool_calls. Hold back text from an
         unclosed `{` so a leak is never painted on screen before we can
         classify it. Normal prose containing a brace flushes untouched. */
      let held = '';
      function safeText(chunk) {
        held += chunk;
        let out = '';
        for (;;) {
          const open = held.indexOf('{');
          if (open === -1) {
            out += held;
            held = '';
            return out;
          }
          out += held.slice(0, open);
          const rest = held.slice(open);
          const close = rest.indexOf('}');
          if (close === -1) {
            held = rest; // incomplete, wait for more
            return out;
          }
          const blob = rest.slice(0, close + 1);
          held = rest.slice(close + 1);
          const m = blob.match(/\{\s*["']?project_id["']?\s*:\s*["']([^"']+)["']\s*\}/);
          if (m && PROJECT_IDS.includes(m[1])) leakedId = m[1];
          else out += blob;
        }
      }

      try {
        const reader = upstream.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (!data || data === '[DONE]') continue;

            let parsed;
            try {
              parsed = JSON.parse(data);
            } catch {
              continue; // OpenRouter sends periodic comment/keepalive lines
            }

            if (parsed.provider) provider = parsed.provider;
            if (parsed.usage) usage = parsed.usage;

            const delta = parsed.choices?.[0]?.delta;
            if (!delta) continue;

            if (delta.content) {
              if (firstTokenAt === null) firstTokenAt = Date.now() - t0;
              fullText += delta.content;
              const safe = safeText(delta.content);
              if (safe) send({ t: 'delta', v: safe });
            }

            for (const call of delta.tool_calls || []) {
              const i = call.index ?? 0;
              const prev = toolParts.get(i) || { name: '', args: '' };
              toolParts.set(i, {
                name: call.function?.name || prev.name,
                args: prev.args + (call.function?.arguments || ''),
              });
            }
          }
        }

        if (held) {
          send({ t: 'delta', v: held });
          held = '';
        }

        /* Resolve the tool call: real tool_calls first, JSON leak as fallback. */
        let toolCall = null;
        for (const { name, args } of toolParts.values()) {
          if (name !== 'open_project') continue;
          try {
            const parsedArgs = JSON.parse(args);
            if (PROJECT_IDS.includes(parsedArgs.project_id)) {
              toolCall = { name: 'open_project', args: parsedArgs };
              break;
            }
          } catch {
            /* ignore malformed fragments */
          }
        }
        if (!toolCall && leakedId) {
          toolCall = { name: 'open_project', args: { project_id: leakedId } };
        }

        /* Silent-open guard: a valid tool call with empty content would open a
           modal with no explanation, so synthesize the "why" from the brain. */
        if (toolCall && !fullText.trim()) {
          const project = PROJECTS_BRAIN.find((p) => p.id === toolCall.args.project_id);
          const fallback = project
            ? `Opening ${project.title}. ${project.one_liner}`
            : 'Opening that one now.';
          send({ t: 'delta', v: fallback });
        }

        if (toolCall) send({ t: 'tool', name: toolCall.name, args: toolCall.args });
        send({ t: 'done' });

        if (DEBUG) {
          console.log(
            JSON.stringify({
              nibble: 'latency',
              question: latest.slice(0, 80),
              route: route.reason,
              projects: route.ids,
              ms: {
                ratelimit: mark.ratelimit,
                routing: mark.routed - mark.ratelimit,
                contextBuild: mark.builtContext - mark.routed,
                upstreamHeaders: mark.upstreamHeaders,
                timeToFirstToken: firstTokenAt,
                generation: firstTokenAt === null ? null : Date.now() - t0 - firstTokenAt,
                totalServer: Date.now() - t0,
              },
              tokensEstimated: tokens,
              tokensActual: usage
                ? { in: usage.prompt_tokens, out: usage.completion_tokens }
                : null,
              maxTokens,
              provider,
              toolCall: toolCall ? toolCall.args.project_id : null,
            })
          );
        }
      } catch (e) {
        console.error('NibbleLM stream failed:', e);
        send({ t: 'error', message: 'NibbleLM lost its train of thought. Try again.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  });
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
