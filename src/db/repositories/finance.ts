import { and, asc, desc, eq, gte, lte } from 'drizzle-orm'
import { endOfMonth, startOfMonth } from 'date-fns'
import { db } from '../client'
import { financeCategories, financeTransactions } from '../schema'
import { toDay } from '@/lib/dates'
import { newId, type FinanceTransaction } from '@/types/domain'

export async function listCategories() {
  return db().select().from(financeCategories).orderBy(asc(financeCategories.sortOrder))
}

export async function listTransactions(opts: { month?: Date; scope?: 'personal' | 'startup'; limit?: number } = {}) {
  const month = opts.month
  const where = and(
    month ? gte(financeTransactions.date, toDay(startOfMonth(month))) : undefined,
    month ? lte(financeTransactions.date, toDay(endOfMonth(month))) : undefined,
    opts.scope ? eq(financeTransactions.scope, opts.scope) : undefined,
  )
  const q = db().select().from(financeTransactions).where(where).orderBy(desc(financeTransactions.date), desc(financeTransactions.createdAt))
  return opts.limit ? q.limit(opts.limit) : q
}

export interface MonthSummary {
  income: number
  expenses: number
  savings: number
  budget: number
  byCategory: { categoryId: string; name: string; spent: number; budget: number | null }[]
}

export async function monthSummary(month: Date = new Date()): Promise<MonthSummary> {
  const [cats, txs] = await Promise.all([listCategories(), listTransactions({ month })])
  const income = sum(txs.filter((t) => t.kind === 'income'))
  const expenses = sum(txs.filter((t) => t.kind === 'expense'))
  const expenseCats = cats.filter((c) => c.kind === 'expense')
  return {
    income,
    expenses,
    savings: income - expenses,
    budget: expenseCats.reduce((acc, c) => acc + (c.monthlyBudget ?? 0), 0),
    byCategory: expenseCats.map((c) => ({
      categoryId: c.id,
      name: c.name,
      budget: c.monthlyBudget,
      spent: sum(txs.filter((t) => t.kind === 'expense' && t.categoryId === c.id)),
    })),
  }
}

function sum(rows: FinanceTransaction[]) {
  return Math.round(rows.reduce((acc, t) => acc + t.amount, 0) * 100) / 100
}

export async function createTransaction(input: Omit<typeof financeTransactions.$inferInsert, 'id'>): Promise<void> {
  await db().insert(financeTransactions).values({ id: newId(), ...input })
}

export async function deleteTransaction(id: string): Promise<void> {
  await db().delete(financeTransactions).where(eq(financeTransactions.id, id))
}

export async function updateCategoryBudget(id: string, monthlyBudget: number | null): Promise<void> {
  await db().update(financeCategories).set({ monthlyBudget }).where(eq(financeCategories.id, id))
}

/** Income, expenses and savings for the last `months` months, oldest first. */
export async function monthlyTotals(months = 6, until: Date = new Date()) {
  const from = startOfMonth(new Date(until.getFullYear(), until.getMonth() - (months - 1), 1))
  const txs = await db()
    .select()
    .from(financeTransactions)
    .where(and(gte(financeTransactions.date, toDay(from)), lte(financeTransactions.date, toDay(endOfMonth(until)))))
  return Array.from({ length: months }, (_, i) => {
    const m = new Date(from.getFullYear(), from.getMonth() + i, 1)
    const key = toDay(m).slice(0, 7)
    const inMonth = txs.filter((t) => t.date.startsWith(key))
    const income = sum(inMonth.filter((t) => t.kind === 'income'))
    const expenses = sum(inMonth.filter((t) => t.kind === 'expense'))
    return { month: toDay(m), income, expenses, savings: income - expenses }
  })
}
