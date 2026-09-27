import * as repo from '@/db/repositories/finance'
import { useDbMutation, useDbQuery } from '@/hooks/data'

export const useCategories = () => useDbQuery(['fin-categories'], repo.listCategories)
export const useTransactions = (opts: Parameters<typeof repo.listTransactions>[0] = {}) =>
  useDbQuery(['transactions', opts.month?.toISOString().slice(0, 7), opts.scope, opts.limit], () => repo.listTransactions(opts))
export const useMonthSummary = (month: Date = new Date()) =>
  useDbQuery(['month-summary', month.toISOString().slice(0, 7)], () => repo.monthSummary(month))

export function useFinanceActions() {
  return {
    create: useDbMutation(repo.createTransaction),
    remove: useDbMutation(repo.deleteTransaction),
    setBudget: useDbMutation(({ id, budget }: { id: string; budget: number | null }) => repo.updateCategoryBudget(id, budget)),
  }
}

export const useMonthlyTotals = (months = 6, until: Date = new Date()) =>
  useDbQuery(['monthly-totals', months, until.toISOString().slice(0, 7)], () => repo.monthlyTotals(months, until))
