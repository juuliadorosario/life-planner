import * as repo from '@/db/repositories/notes'
import { useDbMutation, useDbQuery } from '@/hooks/data'

export const useNotes = (filter: Parameters<typeof repo.listNotes>[0] = {}) => useDbQuery(['notes', filter], () => repo.listNotes(filter))
export const useNote = (id: string) => useDbQuery(['note', id], () => repo.getNote(id), id !== 'new')
export const useBacklinks = (note?: { id: string; title: string }) =>
  useDbQuery(['backlinks', note?.id, note?.title], () => (note ? repo.listBacklinks(note) : Promise.resolve([])), !!note)

export function useNoteActions() {
  return {
    create: useDbMutation(repo.createNote),
    update: useDbMutation(({ id, patch }: { id: string; patch: repo.NoteInput }) => repo.updateNote(id, patch)),
    remove: useDbMutation(repo.deleteNote),
  }
}
