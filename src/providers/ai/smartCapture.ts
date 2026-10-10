/**
 * Smart capture: one sentence in, one sorted item out. Claude decides whether it
 * is a task, a note, an idea or a link, cleans up the title, works out the due
 * date and picks the project / subject / goal it belongs to.
 *
 * Optional: it only runs when an Anthropic API key is saved in Settings (key
 * `aiApiKey`). The key stays in the local database and is sent only to Anthropic.
 */
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { format } from 'date-fns'
import { z } from 'zod'
import { aiError } from './errors'

const MODEL = 'claude-sonnet-5-5'

const Sorted = z.object({
  kind: z.enum(['task', 'note', 'idea', 'link']),
  title: z.string(),
  body: z.string(),
  dueDate: z.string().nullable(),
  url: z.string().nullable(),
  projectId: z.string().nullable(),
  subjectId: z.string().nullable(),
  goalId: z.string().nullable(),
})

export type SortedCapture = z.infer<typeof Sorted>

interface Named {
  id: string
  name: string
}

export interface CaptureTargets {
  projects: Named[]
  subjects: Named[]
  goals: Named[]
}

const SYSTEM = `You sort quick captures for a personal planner. The user types or dictates one thought; you turn it into one item.

Fields:
- kind: "task" for something to do, "note" for information to keep, "idea" for something to explore later, "link" when the capture is mainly a URL.
- title: short and clean, in the user's own language and wording. Do not translate. Leave out the date and the project name once they are captured in other fields.
- body: any extra detail that does not fit in the title, otherwise an empty string.
- dueDate: YYYY-MM-DD, only for tasks and only when the user gives or clearly implies a date ("demà", "divendres", "next week" means its Monday). Otherwise null. Resolve weekdays to the next one after today.
- url: the URL when there is one, otherwise null.
- projectId, subjectId, goalId: the id from the lists below when the capture clearly belongs there, otherwise null. Never invent an id, and prefer null over a guess.`

function list(label: string, items: Named[]): string {
  return `${label}:\n${items.length ? items.map((i) => `- ${i.id}: ${i.name}`).join('\n') : '(none)'}`
}

/** Null out ids the model returned that are not in the list it was given. */
function known(id: string | null, items: Named[]): string | null {
  return id && items.some((i) => i.id === id) ? id : null
}

export async function sortCapture(apiKey: string, text: string, targets: CaptureTargets, now: Date = new Date()): Promise<SortedCapture> {
  // The app is a local desktop webview and the key is the user's own, so calling from here is fine.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: 'low', format: zodOutputFormat(Sorted) },
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            `Today is ${format(now, 'EEEE yyyy-MM-dd')}.`,
            list('Projects', targets.projects),
            list('Subjects', targets.subjects),
            list('Goals', targets.goals),
            `Capture:\n${text}`,
          ].join('\n\n'),
        },
      ],
    })
    const out = response.parsed_output
    if (response.stop_reason === 'refusal' || !out) throw new Error('The AI gave no answer for this one.')
    return {
      ...out,
      title: out.title.trim() || text.trim(),
      dueDate: out.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(out.dueDate) ? out.dueDate : null,
      projectId: known(out.projectId, targets.projects),
      subjectId: known(out.subjectId, targets.subjects),
      goalId: known(out.goalId, targets.goals),
    }
  } catch (error) {
    throw aiError(error)
  }
}
