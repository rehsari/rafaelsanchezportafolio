/* ═══════════════════════════════════════════════════════════════════════════
   NIBBLE-LM CHAT ENDPOINT
   Vercel Edge function. Takes visitor messages + page context, calls
   OpenRouter, returns the assistant's response and any tool call
   (open_project). Rate-limited via Upstash so no one can drain the key.
═══════════════════════════════════════════════════════════════════════════ */

import { PROJECTS_BRAIN, PROJECT_IDS } from '../lib/projects.js';
import { SYSTEM_PROMPT_FULL_V2 } from '../lib/nibble-archive/system-prompt-full.js';
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

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'open_project',
      description:
        "Open a specific project modal on the portfolio. Call this when the visitor asks to see, open, or learn more about a specific project, or when you are confident a specific project is what they should look at next.",
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

/* Full v2 system prompt lives in lib/nibble-archive/system-prompt-full.js
   so it's easy to see and edit in one place. If you ever need to trim
   again (rate limits, cost cap), see lib/nibble-archive/README.md for
   the compressed v3 and the list of trim sites. */
const SYSTEM_PROMPT = SYSTEM_PROMPT_FULL_V2;

/* Compact projection of the brain — sends only the fields NibbleLM
   actually needs in-conversation. Full brain stays intact in
   lib/projects.js for future use. */
function compactBrain(brain) {
  return brain.map((p) => ({
    id: p.id,
    title: p.title,
    one_liner: p.one_liner,
    type: p.type,
    year: p.year,
    role: p.role,
    tools: p.tools,
    context: p.context,
    problem: p.problem,
    approach: p.approach,
    key_decisions: p.key_decisions,
    outcomes: p.outcomes,
    skills_proven: p.skills_proven,
  }));
}

function buildSystemMessage(pageContext) {
  return SYSTEM_PROMPT
    .replace('{{PROJECT_BRAIN_JSON}}', JSON.stringify(compactBrain(PROJECTS_BRAIN)))
    .replace('{{PAGE_CONTEXT_JSON}}', JSON.stringify(pageContext || { current_project_id: null, current_page: 'home' }));
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'anonymous';

  if (ratelimit) {
    try {
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return json(
          { error: "Rate limit reached. NibbleLM needs a coffee. Try again in a bit." },
          429
        );
      }
    } catch (e) {
      // Fail open if Upstash is unreachable
      console.error('Rate limit check failed:', e);
    }
  }

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

  // Basic sanity limits so no one crams the context
  const trimmed = messages.slice(-12).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, 2000),
  }));

  const systemMessage = { role: 'system', content: buildSystemMessage(pageContext) };

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server missing OPENROUTER_API_KEY' }, 500);
  }

  const groqRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // OpenRouter attribution headers — appear on their dashboard, help
      // identify traffic and unlock some model rankings.
      'HTTP-Referer': 'https://www.rafaelsanchez.design',
      'X-Title': 'NibbleLM',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [systemMessage, ...trimmed],
      tools: TOOLS,
      tool_choice: 'auto',
      temperature: 0.6,
      max_tokens: 500,
    }),
  });

  if (!groqRes.ok) {
    const detail = await groqRes.text();
    console.error('OpenRouter error:', groqRes.status, detail);
    return json({ error: 'NibbleLM had trouble thinking. Try again in a moment.' }, 502);
  }

  const data = await groqRes.json();
  const choice = data.choices?.[0];
  const message = choice?.message || {};

  let toolCall = null;
  const calls = message.tool_calls || [];
  if (calls.length > 0) {
    const call = calls[0];
    try {
      const args = JSON.parse(call.function.arguments);
      if (call.function.name === 'open_project' && PROJECT_IDS.includes(args.project_id)) {
        toolCall = { name: 'open_project', args };
      }
    } catch {
      // ignore malformed
    }
  }

  let content = (message.content || '').trim();

  /* JSON-leak guard: gpt-oss-120b occasionally emits its intended tool
     call as a raw JSON blob inside content (e.g. `{ "project_id": "..." }`)
     instead of using the tool_calls array. Detect that, promote it to
     a real toolCall, and strip it from the visible text. */
  if (!toolCall && content) {
    const leak = content.match(/\{\s*["']?project_id["']?\s*:\s*["']([^"']+)["']\s*\}/);
    if (leak && PROJECT_IDS.includes(leak[1])) {
      toolCall = { name: 'open_project', args: { project_id: leak[1] } };
      content = content.replace(leak[0], '').trim();
    }
  }

  /* Silent-open guard: even with a valid tool call, the model often
     returns an empty content field. Synthesize a short one-liner from
     the project brain so the visitor always sees a "why" before the
     modal opens. */
  if (!content && toolCall && toolCall.name === 'open_project') {
    const project = PROJECTS_BRAIN.find((p) => p.id === toolCall.args.project_id);
    if (project) {
      content = `Opening ${project.title}. ${project.one_liner}`;
    } else {
      content = 'Opening that one now.';
    }
  }

  return json({ content, toolCall });
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
