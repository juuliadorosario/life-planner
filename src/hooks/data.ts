import { QueryClient, useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'

/**
 * All data is local, so queries never go stale on their own: they only change
 * when LifeOS writes. Every mutation invalidates everything, which keeps
 * connected objects (a task → its goal, project, widgets) in sync for free.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity, refetchOnWindowFocus: false, retry: false },
  },
})

export function useDbQuery<T>(key: QueryKey, fn: () => Promise<T>, enabled = true) {
  return useQuery({ queryKey: key, queryFn: fn, enabled })
}

export function useDbMutation<A, R = void>(fn: (args: A) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries(),
  })
}
