/**
 * The assistant: a chat with Claude that can read and change the planner.
 *
 * It works straight on the SQLite database through three tools (`query`,
 * `write`, `calendar`) plus `remember` for lasting facts about the user, so
 * anything the app stores is within reach without a tool per feature. Deletes
 * and updates without a WHERE go through `confirm` first. The `settings` table
 * is off limits: it holds the API key.
 *
 * Needs the same Anthropic API key as smart capture (Settings key `aiApiKey`).
 */
import Anthropic from '@anthropic-ai/sdk'
import { format } from 'date-fns'
import { getStorage } from '@/db/client'
import { getSetting, setSetting } from '@/db/repositories/settings'
import { queryClient } from '@/hooks/data'
import { calendarService } from '@/providers/calendar'
import { aiError } from './errors'

const MODEL = 'claude-sonnet-5-5'
const MAX_ROWS = 200
const MAX_RESULT_CHARS = 20_000

const RULES = `You are the assistant inside a personal planner app on the user's Mac. You talk with the user about their tasks, studies, calendar, goals, habits, notes, projects and startup, and you can read and change all of it.

How to talk:
- Answer in the language the user writes in.
- Be brief, concrete and honest, like a friend who knows their week. When asked for an opinion, give one, with the reason.
- The chat shows plain text only: short paragraphs and simple "- " lists. No headings, bold, tables or code blocks.
- Never show ids or SQL to the user.

How to work:
- The data lives in a SQLite database. Use the query tool to look before you answer or change anything; never guess what is there.
- Use the write tool to add or change things when the user asks. Look up the ids you need first. One statement per call.
- After changing something, say in one line what you did. The app updates on its own.
- If a request is ambiguous in a way that matters (which subject, which day), ask before writing.
- Deleting asks the user for confirmation on screen; if they decline, do not try again another way.
- Keep entries in the user's own language and wording.
- When the user tells you something lasting about themselves or how they want you to work, save it with the remember tool.

Database conventions:
- New rows need an id: use lower(hex(randomblob(16))).
- Days are 'YYYY-MM-DD', times 'HH:mm', timestamps full ISO. Booleans are 0/1. JSON columns hold JSON text (for example tags is '["deadline"]').
- tasks: status is todo, doing or done; when marking done also set completed_at to the current ISO timestamp, and clear it when reopening. priority is 0 none, 1 low, 2 medium, 3 high. sort_order for a new task is the current time in milliseconds. A task's kind lives in tags: "deadline" (fixed date that cannot move), "thread" (no date, waiting on someone), "pending" (a fact still missing). Plain tasks have none.
- exams and assignments already show up as fixed dates in the planner. Do not also create a task for them.
- notes: content is HTML, content_text is the same as plain text. Keep both in step.
- calendar_events are the planner's own events (start and end are ISO timestamps). Apple Calendar events are not in the database: read them with the calendar tool. You cannot change Apple Calendar.
- In SELECTs name the columns you want; results come back as arrays in that order.
- The settings table is off limits.`

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'query',
    description: 'Read from the planner database with one SQLite SELECT statement. Returns rows as arrays, in the column order of the SELECT.',
    input_schema: {
      type: 'object',
      properties: {
        purpose: { type: 'string', description: "A few words, in the user's language, on what you are looking at. Shown to the user." },
        sql: { type: 'string', description: 'One SELECT (or WITH ... SELECT) statement.' },
      },
      required: ['purpose', 'sql'],
      additionalProperties: false,
    },
  },
  {
    name: 'write',
    description: 'Change the planner database with one INSERT, UPDATE or DELETE statement. DELETE, and UPDATE without WHERE, ask the user to confirm first.',
    input_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: "One short line, in the user's language, saying what this changes. Shown to the user." },
        sql: { type: 'string', description: 'One INSERT, UPDATE or DELETE statement.' },
      },
      required: ['summary', 'sql'],
      additionalProperties: false,
    },
  },
  {
    name: 'calendar',
    description: "List every calendar event between two days, both included: the planner's own events, exams, study sessions and Apple Calendar.",
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'First day, YYYY-MM-DD.' },
        to: { type: 'string', description: 'Last day, YYYY-MM-DD.' },
      },
      required: ['from', 'to'],
      additionalProperties: false,
    },
  },
  {
    name: 'remember',
    description: 'Save one lasting fact about the user or how they want you to work. It is given back to you at the start of every chat.',
    input_schema: {
      type: 'object',
      properties: { fact: { type: 'string', description: 'One sentence.' } },
      required: ['fact'],
      additionalProperties: false,
    },
  },
]

export interface AssistantCallbacks {
  /** A piece of the answer, as it is written. */
  onText(delta: string): void
  /** The assistant looked something up or changed something. */
  onActivity(label: string, kind: 'read' | 'write'): void
  /** Ask the user before a destructive change. Resolves true to go ahead. */
  confirm(summary: string): Promise<boolean>
}

const single = (sql: string) => sql.trim().replace(/;\s*$/, '')

function check(sql: string, allowed: RegExp): string | null {
  // Text values are blanked first, so a note that contains ";" or the word "settings" is fine.
  const bare = sql.replace(/'(?:[^']|'')*'/g, "''")
  if (bare.includes(';')) return 'Only one statement per call.'
  if (!allowed.test(bare)) return 'That kind of statement is not allowed here.'
  if (/\bsettings\b/i.test(bare) || /\bsqlite_/i.test(bare)) return 'That table is off limits.'
  return null
}

async function runQuery(input: { sql: string }): Promise<string> {
  const sql = single(input.sql)
  const problem = check(sql, /^\s*(select|with)\b/i)
  if (problem) return problem
  const { rows } = await getStorage().query(sql, [], 'all')
  const shown = rows.slice(0, MAX_ROWS)
  let out = JSON.stringify(shown)
  if (out.length > MAX_RESULT_CHARS) return `The result is too large (${rows.length} rows). Select fewer columns or add a WHERE or LIMIT.`
  if (rows.length > MAX_ROWS) out += `\n(first ${MAX_ROWS} of ${rows.length} rows)`
  return out
}

async function runWrite(input: { summary: string; sql: string }, cb: AssistantCallbacks): Promise<string> {
  const sql = single(input.sql)
  const problem = check(sql, /^\s*(insert|update|delete)\b/i)
  if (problem) return problem
  const risky = /^\s*delete\b/i.test(sql) || (/^\s*update\b/i.test(sql) && !/\bwhere\b/i.test(sql))
  if (risky && !(await cb.confirm(input.summary))) return 'The user declined this change.'
  await getStorage().query(sql, [], 'run')
  await queryClient.invalidateQueries()
  cb.onActivity(input.summary, 'write')
  return 'Done.'
}

async function runCalendar(input: { from: string; to: string }): Promise<string> {
  const events = await calendarService.listEvents({ start: new Date(`${input.from}T00:00:00`), end: new Date(`${input.to}T23:59:59`) })
  return JSON.stringify(
    events.slice(0, MAX_ROWS).map((e) => ({
      title: e.title,
      start: format(e.start, e.allDay ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm"),
      end: format(e.end, e.allDay ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm"),
      allDay: e.allDay,
      category: e.category,
      from: e.sourceLabel ?? e.source,
    })),
  )
}

async function runRemember(input: { fact: string }): Promise<string> {
  const about = ((await getSetting<string>('aiAbout')) ?? '').trim()
  await setSetting('aiAbout', [about, `- ${input.fact.trim()}`].filter(Boolean).join('\n'))
  await queryClient.invalidateQueries()
  return 'Saved.'
}

async function runTool(block: Anthropic.ToolUseBlock, cb: AssistantCallbacks): Promise<Anthropic.ToolResultBlockParam> {
  const input = block.input as Record<string, string>
  try {
    let content: string
    if (block.name === 'query') {
      cb.onActivity(input.purpose, 'read')
      content = await runQuery({ sql: input.sql })
    } else if (block.name === 'write') content = await runWrite({ summary: input.summary, sql: input.sql }, cb)
    else if (block.name === 'calendar') {
      cb.onActivity(`${input.from} → ${input.to}`, 'read')
      content = await runCalendar({ from: input.from, to: input.to })
    } else if (block.name === 'remember') content = await runRemember({ fact: input.fact })
    else content = 'Unknown tool.'
    return { type: 'tool_result', tool_use_id: block.id, content }
  } catch (error) {
    // SQL errors go back to the model so it can fix the statement.
    return { type: 'tool_result', tool_use_id: block.id, content: String(error instanceof Error ? error.message : error), is_error: true }
  }
}

/** The stable part of the prompt (rules + schema) is cached; today's date and the user's notes come after it. */
async function buildSystem(now: Date): Promise<Anthropic.TextBlockParam[]> {
  const { rows } = await getStorage().query(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '\\_\\_%' ESCAPE '\\' AND name != 'settings' ORDER BY name",
    [],
    'all',
  )
  const schema = (rows as unknown[][]).map((r) => r[0]).join('\n\n')
  const [name, about] = await Promise.all([getSetting<string>('userName'), getSetting<string>('aiAbout')])
  return [
    { type: 'text', text: `${RULES}\n\nDatabase schema:\n\n${schema}`, cache_control: { type: 'ephemeral' } },
    {
      type: 'text',
      text: [`Now: ${format(now, "EEEE yyyy-MM-dd HH:mm")}.`, name ? `The user's name is ${name}.` : '', about?.trim() ? `What you know about the user:\n${about.trim()}` : '']
        .filter(Boolean)
        .join('\n\n'),
    },
  ]
}

/**
 * Answer the last user message in `history`, running tools until Claude is done.
 * `history` is extended in place with everything that has to be sent back next turn.
 */
export async function runAssistant(apiKey: string, history: Anthropic.MessageParam[], cb: AssistantCallbacks, signal?: AbortSignal): Promise<void> {
  // The app is a local desktop webview and the key is the user's own, so calling from here is fine.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const system = await buildSystem(new Date())
  try {
    for (;;) {
      const stream = client.messages.stream({ model: MODEL, max_tokens: 16000, output_config: { effort: 'medium' }, system, tools: TOOLS, messages: history }, { signal })
      stream.on('text', (delta) => cb.onText(delta))
      const message = await stream.finalMessage()
      // The full content goes back, thinking blocks included.
      history.push({ role: 'assistant', content: message.content })
      if (message.stop_reason === 'refusal') throw new Error('The AI declined to answer this one.')
      if (message.stop_reason !== 'tool_use') return
      const results: Anthropic.ToolResultBlockParam[] = []
      for (const block of message.content) {
        if (block.type === 'tool_use') results.push(await runTool(block, cb))
      }
      history.push({ role: 'user', content: results })
    }
  } catch (error) {
    throw aiError(error)
  }
}
