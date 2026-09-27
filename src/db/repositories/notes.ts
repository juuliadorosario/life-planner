import { desc, eq, like, or } from 'drizzle-orm'
import { db } from '../client'
import { notes } from '../schema'
import { newId, type Note } from '@/types/domain'

export type NoteInput = Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>

export async function listNotes(filter: { projectId?: string; subjectId?: string; goalId?: string; examId?: string; areaId?: string; folder?: string; limit?: number } = {}): Promise<Note[]> {
  const where = filter.projectId
    ? eq(notes.projectId, filter.projectId)
    : filter.subjectId
      ? eq(notes.subjectId, filter.subjectId)
      : filter.goalId
        ? eq(notes.goalId, filter.goalId)
        : filter.examId
          ? eq(notes.examId, filter.examId)
          : filter.areaId
            ? eq(notes.areaId, filter.areaId)
            : filter.folder
              ? eq(notes.folder, filter.folder)
              : undefined
  const q = db().select().from(notes).where(where).orderBy(desc(notes.pinned), desc(notes.updatedAt))
  return filter.limit ? q.limit(filter.limit) : q
}

export async function getNote(id: string): Promise<Note | undefined> {
  return db().select().from(notes).where(eq(notes.id, id)).get()
}

export async function createNote(input: NoteInput = {}): Promise<Note> {
  const [row] = await db()
    .insert(notes)
    .values({ id: newId(), title: '', updatedAt: new Date().toISOString(), ...input })
    .returning()
  return row
}

export async function updateNote(id: string, patch: NoteInput): Promise<void> {
  await db()
    .update(notes)
    .set({ ...patch, updatedAt: new Date().toISOString() })
    .where(eq(notes.id, id))
}

export async function deleteNote(id: string): Promise<void> {
  await db().delete(notes).where(eq(notes.id, id))
}

/** Notes that mention `[[title]]`. */
export async function listBacklinks(note: Pick<Note, 'id' | 'title'>): Promise<Note[]> {
  if (!note.title.trim()) return []
  const rows = await db()
    .select()
    .from(notes)
    .where(or(like(notes.contentText, `%[[${note.title}]]%`)))
  return rows.filter((n) => n.id !== note.id)
}

export async function findNoteByTitle(title: string): Promise<Note | undefined> {
  return db().select().from(notes).where(eq(notes.title, title)).get()
}
