/**
 * Demo data so LifeOS feels alive on first launch. Every date is relative to
 * today, so the dashboard never looks stale. Runs once, when `settings` has no
 * `seeded` key.
 */
import { eq } from 'drizzle-orm'
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy'
import { dayOffset, toDay } from '@/lib/dates'
import { newId } from '@/types/domain'
import * as s from './schema'
import { DEFAULT_WIDGETS } from './defaultWidgets'
import { personal } from '@/config/personal'

type DB = SqliteRemoteDatabase<typeof s>

const d = dayOffset
/** Deterministic pseudo-random, so the demo looks the same on every reset. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}
function at(day: string, time: string) {
  return new Date(`${day}T${time}:00`).toISOString()
}
function p(...paragraphs: string[]) {
  return paragraphs.map((t) => (t.startsWith('<') ? t : `<p>${t}</p>`)).join('')
}
function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function seedIfEmpty(db: DB): Promise<void> {
  const seeded = await db.select().from(s.settings).where(eq(s.settings.key, 'seeded')).get()
  if (!seeded) {
    await seed(db)
    await db.insert(s.settings).values({ key: 'seeded', value: new Date().toISOString() })
  }
  await seedOnce(db, 'seeded.marketing', seedMarketing)
}

/** Demo data added after the first release: runs once, also on existing databases. */
async function seedOnce(db: DB, key: string, fn: (db: DB) => Promise<void>) {
  const done = await db.select().from(s.settings).where(eq(s.settings.key, key)).get()
  if (done) return
  await fn(db)
  await db.insert(s.settings).values({ key, value: new Date().toISOString() })
}

async function seedMarketing(db: DB) {
  const now = new Date()
  const month = (ago: number) => toDay(new Date(now.getFullYear(), now.getMonth() - ago, 1))
  const series: Record<string, number[]> = {
    instagram: [120, 164, 210, 268, 341, 412],
    linkedin: [80, 96, 118, 150, 182, 230],
    tiktok: [0, 0, 45, 130, 210, 380],
    web: [150, 240, 310, 420, 560, 730],
    leads: [1, 3, 4, 7, 9, 14],
  }
  const stats: (typeof s.channelStats.$inferInsert)[] = []
  for (const [channel, values] of Object.entries(series)) {
    values.forEach((value, i) => stats.push({ id: newId(), month: month(5 - i), channel, value }))
  }
  await db.insert(s.channelStats).values(stats)
  await db.insert(s.marketingPosts).values([
    { id: newId(), title: 'Behind the scenes: a morning at the bakery', channel: 'instagram', date: dayOffset(-6), status: 'published' },
    { id: newId(), title: 'Why paper records fail inspections', channel: 'linkedin', date: dayOffset(-3), status: 'published' },
    { id: newId(), title: 'Product demo in 30 seconds', channel: 'tiktok', date: dayOffset(2), status: 'doing' },
    { id: newId(), title: 'Customer story: a local ice-cream shop', channel: 'web', date: dayOffset(5), status: 'doing' },
    { id: newId(), title: 'Allergen checklist (free download)', channel: 'email', date: dayOffset(9), status: 'idea' },
    { id: newId(), title: 'Meet the blueberry — mascot reel', channel: 'instagram', date: null, status: 'idea' },
  ])
}

async function seed(db: DB) {
  const now = new Date()

  // ── Areas ────────────────────────────────────────────────────────────────
  const area = { study: newId(), startup: newId(), health: newId(), finance: newId(), personal: newId() }
  await db.insert(s.areas).values([
    { id: area.study, name: 'Study', slug: 'study', sortOrder: 0 },
    { id: area.startup, name: 'Startup', slug: 'startup', sortOrder: 1 },
    { id: area.health, name: 'Health', slug: 'health', sortOrder: 2 },
    { id: area.finance, name: 'Finance', slug: 'finance', sortOrder: 3 },
    { id: area.personal, name: 'Personal', slug: 'personal', sortOrder: 4 },
  ])

  const ago = (days: number) => new Date(now.getTime() - days * 86400000).toISOString()

  // ── Goals ────────────────────────────────────────────────────────────────
  const goal = { launch: newId(), grades: newId(), train: newId(), save: newId(), read: newId() }
  await db.insert(s.goals).values([
    { id: goal.launch, title: 'Launch the startup', description: 'Go from a working MVP to the first paying customers.', areaId: area.startup, deadline: d(95), progress: 0, createdAt: ago(75) },
    { id: goal.grades, title: 'Improve grades', description: 'Average above 8.5 this term, no subject below 7.', areaId: area.study, deadline: d(80), progress: 0, createdAt: ago(25) },
    { id: goal.train, title: 'Train 4× a week', description: 'Consistency over intensity. Strength + one long run.', areaId: area.health, deadline: d(60), progress: 0, createdAt: ago(50) },
    { id: goal.save, title: 'Save €2,000', description: 'Emergency fund before the summer.', areaId: area.finance, deadline: d(200), progress: 46, createdAt: ago(100) },
    { id: goal.read, title: 'Read 12 books this year', description: 'Mostly non-fiction, one novel a month.', areaId: area.personal, deadline: `${now.getFullYear()}-12-31`, progress: 58, createdAt: new Date(now.getFullYear(), 0, 1).toISOString() },
  ])
  const milestones: (typeof s.goalMilestones.$inferInsert)[] = []
  const addMilestones = (goalId: string, items: [string, boolean][]) =>
    items.forEach(([title, done], i) => milestones.push({ id: newId(), goalId, title, done, sortOrder: i }))
  addMilestones(goal.launch, [
    ['Interview 10 potential customers', true],
    ['Ship the MVP', true],
    ['Redesign the website', false],
    ['First paying customer', false],
    ['10 paying customers', false],
  ])
  addMilestones(goal.grades, [
    ['Mathematics above 8', true],
    ['Business above 8', false],
    ['History essay submitted on time', true],
    ['Final average above 8.5', false],
  ])
  addMilestones(goal.train, [
    ['4 workouts in one week', true],
    ['4 weeks in a row', true],
    ['8 weeks in a row', false],
  ])
  await db.insert(s.goalMilestones).values(milestones)

  // ── Projects ─────────────────────────────────────────────────────────────
  const project = { website: newId(), marketing: newId(), econPrep: newId(), gym: newId(), personalSite: newId() }
  await db.insert(s.projects).values([
    { id: project.website, name: 'Website redesign', description: 'New landing page, clearer pricing and a proper demo section.', areaId: area.startup, goalId: goal.launch, deadline: d(18) },
    { id: project.marketing, name: 'Marketing campaign', description: 'Autumn outreach: 50 local businesses, one case study, a short video.', areaId: area.startup, goalId: goal.launch, deadline: d(40) },
    { id: project.econPrep, name: 'Business exam preparation', description: 'Chapters 4–7, past papers and a final mock exam.', areaId: area.study, goalId: goal.grades, deadline: d(7) },
    { id: project.gym, name: 'Gym program', description: 'Upper / lower split, 4 days a week, progressive overload.', areaId: area.health, goalId: goal.train },
    { id: project.personalSite, name: 'Personal website', description: 'A small portfolio: projects, writing and contact.', areaId: area.personal, status: 'paused' },
  ])

  // ── Study ────────────────────────────────────────────────────────────────
  // Demo subjects.
  const subject = {
    econ: newId(), // Business
    math: newId(),
    philosophy: newId(),
    history: newId(),
    catalan: newId(),
    spanish: newId(),
    english: newId(),
    geography: newId(),
  }
  await db.insert(s.subjects).values([
    { id: subject.econ, name: 'Business', teacher: 'Mr. Ferrer', sortOrder: 0 },
    { id: subject.math, name: 'Mathematics', teacher: 'Ms. Puig', sortOrder: 1 },
    { id: subject.philosophy, name: 'Philosophy', teacher: 'Mr. Serra', sortOrder: 2 },
    { id: subject.history, name: 'History', teacher: 'Ms. Vidal', sortOrder: 3 },
    { id: subject.catalan, name: 'Catalan', teacher: 'Ms. Roca', sortOrder: 4 },
    { id: subject.spanish, name: 'Spanish', teacher: 'Ms. Navarro', sortOrder: 5 },
    { id: subject.english, name: 'English', teacher: 'Mr. Clarke', sortOrder: 6 },
    { id: subject.geography, name: 'Geography', teacher: 'Mr. Pujol', sortOrder: 7 },
  ])
  const topics: (typeof s.subjectTopics.$inferInsert)[] = []
  const addTopics = (subjectId: string, items: [string, boolean][]) =>
    items.forEach(([name, done], i) => topics.push({ id: newId(), subjectId, name, done, sortOrder: i }))
  addTopics(subject.math, [['Algebra', true], ['Functions', true], ['Limits', true], ['Derivatives', true], ['Integrals', true], ['Probability', false], ['Statistics', false]])
  addTopics(subject.econ, [['The firm and its environment', true], ['Business organisation', true], ['Marketing', true], ['Financial statements', false], ['Ratio analysis', false], ['Investment appraisal', false], ['Business strategy', false]])
  addTopics(subject.philosophy, [['The Presocratics', true], ['Plato', true], ['Aristotle', false], ['Descartes', false], ['Kant', false], ['Nietzsche', false]])
  addTopics(subject.catalan, [['Text commentary', true], ['Syntax', true], ['Noucentisme', false], ['Mercè Rodoreda', false], ['Poetry after 1939', false]])
  addTopics(subject.spanish, [['Text commentary', true], ['Syntax', true], ['Generation of ’27', false], ['Lorca', false], ['The novel after 1939', false]])
  addTopics(subject.geography, [['Physical geography', true], ['Climate', true], ['Population', false], ['Urban geography', false], ['Economic sectors', false]])
  addTopics(subject.history, [['Industrial Revolution', true], ['Liberal revolutions', true], ['Imperialism', true], ['World War I', true], ['Interwar period', false]])
  addTopics(subject.english, [['Essay structure', true], ['Conditionals', true], ['Reported speech', false], ['Literature: Orwell', false]])
  await db.insert(s.subjectTopics).values(topics)

  const exam = { econ: newId(), math: newId(), history: newId(), englishPast: newId(), geography: newId() }
  await db.insert(s.exams).values([
    { id: exam.econ, title: 'Business — Unit 2', subjectId: subject.econ, date: d(7), time: '09:00', location: 'Room 204', description: 'Finance: financial statements, ratio analysis and investment appraisal.', topics: ['Financial statements', 'Ratio analysis', 'Investment appraisal'] },
    { id: exam.geography, title: 'Geography — Population', subjectId: subject.geography, date: d(16), time: '11:30', location: 'Room 121', description: 'Population structure, migration and urban growth.', topics: ['Population', 'Urban geography'] },
    { id: exam.math, title: 'Mathematics — Probability', subjectId: subject.math, date: d(12), time: '10:30', location: 'Room 112', description: 'Probability and an introduction to statistics.', topics: ['Probability', 'Statistics'] },
    { id: exam.history, title: 'History — Interwar period', subjectId: subject.history, date: d(20), time: '09:00', location: 'Room 118', topics: ['World War I', 'Interwar period'] },
    { id: exam.englishPast, title: 'English — Writing', subjectId: subject.english, date: d(-9), time: '11:00', location: 'Room 015', topics: ['Essay structure', 'Conditionals'], status: 'done', grade: '8.7' },
  ])

  await db.insert(s.assignments).values([
    { id: newId(), title: 'Problem set 6', subjectId: subject.math, dueDate: d(3) },
    { id: newId(), title: 'Essay: causes of the Great Depression', subjectId: subject.history, dueDate: d(9) },
    { id: newId(), title: 'Reading log — Animal Farm', subjectId: subject.english, dueDate: d(5) },
    { id: newId(), title: 'Marketing plan for a local brand', subjectId: subject.econ, dueDate: d(-2), done: true },
    { id: newId(), title: 'Essay: Plato’s allegory of the cave', subjectId: subject.philosophy, dueDate: d(6) },
    { id: newId(), title: 'Text commentary — Rodoreda', subjectId: subject.catalan, dueDate: d(4) },
    { id: newId(), title: 'Reading: Bodas de sangre', subjectId: subject.spanish, dueDate: d(10) },
  ])

  await db.insert(s.studySessions).values([
    { id: newId(), subjectId: subject.econ, examId: exam.econ, title: 'Financial statements — summary', date: d(0), startTime: '10:30', durationMin: 90 },
    { id: newId(), subjectId: subject.econ, examId: exam.econ, title: 'Past paper 2023', date: d(2), startTime: '16:00', durationMin: 60 },
    { id: newId(), subjectId: subject.econ, examId: exam.econ, title: 'Mock exam', date: d(5), startTime: '16:00', durationMin: 90 },
    { id: newId(), subjectId: subject.math, examId: exam.math, title: 'Probability exercises', date: d(1), startTime: '17:30', durationMin: 60 },
    { id: newId(), subjectId: subject.math, examId: exam.math, title: 'Statistics — theory', date: d(8), startTime: '16:00', durationMin: 60 },
    { id: newId(), subjectId: subject.econ, examId: exam.econ, title: 'Ratio analysis', date: d(-1), startTime: '16:00', durationMin: 75, done: true },
    { id: newId(), subjectId: subject.history, title: 'Timeline revision', date: d(-3), startTime: '17:00', durationMin: 45, done: true },
    { id: newId(), subjectId: subject.math, title: 'Integrals recap', date: d(-4), startTime: '16:30', durationMin: 60, done: true },
  ])

  // ── Tasks ────────────────────────────────────────────────────────────────
  type T = typeof s.tasks.$inferInsert
  const task = (t: Omit<T, 'id'>): T => ({ id: newId(), ...t })
  const doneAt = (days: number) => new Date(now.getTime() + days * 86400000).toISOString()
  await db.insert(s.tasks).values([
    task({ title: 'Finish business chapter 5', dueDate: d(0), priority: 3, areaId: area.study, subjectId: subject.econ, projectId: project.econPrep, examId: exam.econ, goalId: goal.grades, sortOrder: 1 }),
    task({ title: 'Send follow-up email to the bakery', dueDate: d(0), priority: 2, areaId: area.startup, projectId: project.marketing, goalId: goal.launch, sortOrder: 2 }),
    task({ title: 'Workout — upper body', dueDate: d(0), priority: 1, areaId: area.health, projectId: project.gym, goalId: goal.train, sortOrder: 3 }),
    task({ title: 'Review history notes', dueDate: d(0), priority: 0, areaId: area.study, subjectId: subject.history, sortOrder: 4 }),
    task({ title: 'Prepare presentation for demo day', dueDate: d(-1), priority: 3, areaId: area.startup, goalId: goal.launch, sortOrder: 5, tags: ['pitch'] }),
    task({ title: 'Probability exercises 1–20', dueDate: d(1), priority: 2, areaId: area.study, subjectId: subject.math, examId: exam.math, sortOrder: 6 }),
    task({ title: 'Write pricing page copy', dueDate: d(2), priority: 2, areaId: area.startup, projectId: project.website, goalId: goal.launch, sortOrder: 7 }),
    task({ title: 'Business past paper 2023', dueDate: d(3), priority: 2, areaId: area.study, subjectId: subject.econ, examId: exam.econ, projectId: project.econPrep, sortOrder: 8 }),
    task({ title: 'New homepage hero in Figma', dueDate: d(4), priority: 1, areaId: area.startup, projectId: project.website, sortOrder: 9 }),
    task({ title: 'Book physiotherapy appointment', dueDate: d(6), priority: 1, areaId: area.health, sortOrder: 10 }),
    task({ title: 'Make flashcards for financial ratios', dueDate: d(5), priority: 1, areaId: area.study, subjectId: subject.econ, examId: exam.econ, projectId: project.econPrep, sortOrder: 11 }),
    task({ title: 'Record 60-second product video', dueDate: d(9), priority: 1, areaId: area.startup, projectId: project.marketing, sortOrder: 12 }),
    task({ title: 'Cancel unused subscriptions', priority: 0, areaId: area.finance, goalId: goal.save, sortOrder: 13 }),
    task({ title: 'Ideas for the personal website', priority: 0, areaId: area.personal, projectId: project.personalSite, sortOrder: 14 }),
    task({ title: 'Look into accounting options', priority: 1, areaId: area.startup, sortOrder: 15, tags: ['admin'] }),
    task({ title: 'Outline business chapter 4', status: 'done', dueDate: d(-2), completedAt: doneAt(-2), areaId: area.study, subjectId: subject.econ, examId: exam.econ, projectId: project.econPrep, sortOrder: 16 }),
    task({ title: 'Interview two more customers', status: 'done', dueDate: d(-3), completedAt: doneAt(-3), areaId: area.startup, goalId: goal.launch, projectId: project.marketing, sortOrder: 17 }),
    task({ title: 'Plan next week', status: 'done', dueDate: d(-1), completedAt: doneAt(-1), areaId: area.personal, sortOrder: 18 }),
  ])

  // ── Notes ────────────────────────────────────────────────────────────────
  type N = typeof s.notes.$inferInsert
  const note = (n: Omit<N, 'id' | 'contentText'> & { content: string }, updatedDaysAgo: number): N => ({
    id: newId(),
    contentText: stripHtml(n.content),
    createdAt: doneAt(-updatedDaysAgo - 3),
    updatedAt: doneAt(-updatedDaysAgo),
    ...n,
  })
  await db.insert(s.notes).values([
    note({
      title: 'Business — Chapter 5: Financial statements',
      folder: 'Study',
      areaId: area.study, subjectId: subject.econ, examId: exam.econ, projectId: project.econPrep,
      tags: ['exam', 'finance'],
      content: p(
        '<h2>Key ideas</h2>',
        '<ul><li><p><strong>Balance sheet</strong> = what the firm owns (assets) and how it is financed (equity + liabilities).</p></li><li><p><strong>Income statement</strong> = revenue minus costs over a period → profit.</p></li><li><p>Assets = Equity + Liabilities, always.</p></li></ul>',
        '<h2>Key ratios</h2>',
        'Current ratio = current assets ÷ current liabilities. Healthy between 1.5 and 2 — below 1 means trouble paying short-term debts.',
        '<blockquote><p>Link to [[Business — Chapter 4: Business organisation]] for how departments fit together.</p></blockquote>',
      ),
    }, 0),
    note({
      title: 'Business — Chapter 4: Business organisation',
      folder: 'Study',
      areaId: area.study, subjectId: subject.econ, examId: exam.econ,
      tags: ['organisation'],
      content: p('<h2>Structures</h2>', 'Functional, divisional and matrix. Small firms tend to be flat; large ones add layers of management.', '<h2>Departments</h2>', 'Production, marketing, finance and human resources — each with its own goals, all serving the firm’s strategy.'),
    }, 2),
    note({
      title: 'Pricing page ideas',
      folder: 'Startup',
      kind: 'idea',
      areaId: area.startup, projectId: project.website, goalId: goal.launch,
      pinned: true,
      tags: ['pricing'],
      content: p(
        'Three plans, one highlighted. Annual pricing with two months free.',
        '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Compare 5 competitor pricing pages</p></li><li data-type="taskItem" data-checked="false"><p>Decide on the free trial length</p></li><li data-type="taskItem" data-checked="false"><p>Write FAQ for the pricing page</p></li></ul>',
        'Related: [[Customer interviews — summary]]',
      ),
    }, 1),
    note({
      title: 'Customer interviews — summary',
      folder: 'Startup',
      areaId: area.startup, goalId: goal.launch, projectId: project.marketing,
      tags: ['research'],
      content: p('<h2>What we heard</h2>', '<ol><li><p>Paperwork takes 3–5 hours a week.</p></li><li><p>Inspections are the moment of truth.</p></li><li><p>Nobody wants another complicated app.</p></li></ol>', 'Next: turn these into the homepage story for the [[Pricing page ideas]].'),
    }, 4),
    note({
      title: 'Gym program — upper / lower',
      folder: 'Health',
      areaId: area.health, projectId: project.gym, goalId: goal.train,
      content: p('<h2>Upper</h2>', 'Bench press 4×6 · Rows 4×8 · Overhead press 3×8 · Pull-ups 3×max', '<h2>Lower</h2>', 'Squat 4×6 · Romanian deadlift 3×8 · Lunges 3×10 · Calf raises 3×15'),
    }, 6),
    note({
      title: 'Books to read',
      folder: 'Personal',
      areaId: area.personal, goalId: goal.read,
      content: p('<ul><li><p>The Psychology of Money — Morgan Housel</p></li><li><p>Deep Work — Cal Newport</p></li><li><p>Animal Farm — George Orwell (for English)</p></li><li><p>The Mom Test — Rob Fitzpatrick</p></li></ul>'),
    }, 9),
  ])

  // ── Health ───────────────────────────────────────────────────────────────
  const habit = { workout: newId(), reading: newId(), water: newId(), sleep: newId(), meditation: newId() }
  await db.insert(s.habits).values([
    { id: habit.workout, name: 'Workout', icon: 'dumbbell', goalId: goal.train, targetPerWeek: 4, sortOrder: 0 },
    { id: habit.reading, name: 'Read 20 pages', icon: 'book-open', goalId: goal.read, targetPerWeek: 7, sortOrder: 1 },
    { id: habit.water, name: 'Drink 2L of water', icon: 'droplet', targetPerWeek: 7, sortOrder: 2 },
    { id: habit.sleep, name: 'In bed by 23:30', icon: 'moon', targetPerWeek: 7, sortOrder: 3 },
    { id: habit.meditation, name: 'Meditate', icon: 'wind', targetPerWeek: 5, sortOrder: 4 },
  ])
  const logs: (typeof s.habitLogs.$inferInsert)[] = []
  const rates: Record<string, number> = { [habit.workout]: 0.55, [habit.reading]: 0.8, [habit.water]: 0.7, [habit.sleep]: 0.6, [habit.meditation]: 0.5 }
  Object.entries(rates).forEach(([habitId, rate], h) => {
    for (let i = 1; i <= 27; i++) {
      if (rand(i * 7 + h * 31) < rate) logs.push({ id: newId(), habitId, date: d(-i) })
    }
  })
  logs.push({ id: newId(), habitId: habit.water, date: d(0) }, { id: newId(), habitId: habit.reading, date: d(0) })
  await db.insert(s.habitLogs).values(logs)

  const workoutRows: (typeof s.workouts.$inferInsert)[] = []
  const exercises: (typeof s.workoutExercises.$inferInsert)[] = []
  const plans = [
    { title: 'Upper body', kind: 'strength', min: 60, kcal: 380, ex: [['Bench press', 4, 6, 40], ['Barbell row', 4, 8, 35], ['Overhead press', 3, 8, 22.5], ['Pull-ups', 3, 6, null]] },
    { title: 'Lower body', kind: 'strength', min: 55, kcal: 420, ex: [['Back squat', 4, 6, 55], ['Romanian deadlift', 3, 8, 45], ['Walking lunges', 3, 10, 12], ['Calf raises', 3, 15, null]] },
    { title: 'Easy run', kind: 'cardio', min: 35, kcal: 310, ex: [] },
    { title: 'Mobility + core', kind: 'mobility', min: 30, kcal: 140, ex: [['Plank', 3, 1, null], ['Dead bug', 3, 12, null], ['Hip openers', 2, 10, null]] },
  ] as const
  ;[-1, -3, -4, -6, -8, -10, -11, -13].forEach((offset, i) => {
    const plan = plans[i % plans.length]
    const workoutId = newId()
    workoutRows.push({ id: workoutId, date: d(offset), title: plan.title, kind: plan.kind, durationMin: plan.min, calories: plan.kcal, goalId: goal.train })
    plan.ex.forEach(([name, sets, reps, weightKg], j) => exercises.push({ id: newId(), workoutId, name, sets, reps, weightKg, sortOrder: j }))
  })
  await db.insert(s.workouts).values(workoutRows)
  await db.insert(s.workoutExercises).values(exercises)

  await db.insert(s.sleepLogs).values(
    Array.from({ length: 14 }, (_, i) => ({
      id: newId(),
      date: d(-i),
      hours: Math.round((6.4 + rand(i + 3) * 2) * 4) / 4,
      quality: 2 + Math.round(rand(i + 11) * 3),
    })),
  )

  // ── Finance ──────────────────────────────────────────────────────────────
  const cat = { food: newId(), transport: newId(), shopping: newId(), subs: newId(), education: newId(), startup: newId(), other: newId(), allowance: newId(), freelance: newId() }
  await db.insert(s.financeCategories).values([
    { id: cat.food, name: 'Food', monthlyBudget: 180, sortOrder: 0 },
    { id: cat.transport, name: 'Transport', monthlyBudget: 45, sortOrder: 1 },
    { id: cat.shopping, name: 'Shopping', monthlyBudget: 80, sortOrder: 2 },
    { id: cat.subs, name: 'Subscriptions', monthlyBudget: 35, sortOrder: 3 },
    { id: cat.education, name: 'Education', monthlyBudget: 40, sortOrder: 4 },
    { id: cat.startup, name: 'Startup', monthlyBudget: 120, sortOrder: 5 },
    { id: cat.other, name: 'Other', monthlyBudget: 50, sortOrder: 6 },
    { id: cat.allowance, name: 'Allowance', kind: 'income', sortOrder: 7 },
    { id: cat.freelance, name: 'Freelance', kind: 'income', sortOrder: 8 },
  ])
  const month = new Date(now.getFullYear(), now.getMonth(), 1)
  const inMonth = (monthsAgo: number, dayOfMonth: number) => {
    const date = new Date(month.getFullYear(), month.getMonth() - monthsAgo, dayOfMonth)
    return date > now ? toDay(now) : toDay(date)
  }
  type Tx = typeof s.financeTransactions.$inferInsert
  const tx: Tx[] = []
  for (const m of [0, 1, 2]) {
    const add = (day: number, description: string, amount: number, categoryId: string, extra: Partial<Tx> = {}) =>
      tx.push({ id: newId(), date: inMonth(m, day), description, amount, categoryId, kind: 'expense', ...extra })
    add(1, 'Monthly allowance', 300, cat.allowance, { kind: 'income' })
    add(12, 'Logo design for a local shop', 180 + m * 40, cat.freelance, { kind: 'income' })
    add(2, 'Spotify', 5.99, cat.subs)
    add(3, 'Notion Plus', 9.5, cat.subs)
    add(4, 'Groceries', 38.4 + m * 3, cat.food)
    add(8, 'Lunch with friends', 16.5, cat.food)
    add(15, 'Groceries', 41.2, cat.food)
    add(20, 'Coffee & pastries', 11.8, cat.food)
    add(5, 'Monthly transport card', 21, cat.transport)
    add(10, 'Running shoes', m === 1 ? 89 : 24.9, cat.shopping)
    add(7, 'Past exam booklets', 18, cat.education)
    add(6, 'Domain + hosting', 14, cat.startup, { scope: 'startup', projectId: project.website })
    add(14, 'Printing flyers', 32, cat.startup, { scope: 'startup', projectId: project.marketing })
    add(18, 'Cinema', 8.5, cat.other)
  }
  await db.insert(s.financeTransactions).values(tx)

  await db.insert(s.startupMetrics).values(
    [5, 4, 3, 2, 1, 0].map((monthsAgo, i) => ({
      id: newId(),
      month: toDay(new Date(month.getFullYear(), month.getMonth() - monthsAgo, 1)),
      revenue: [0, 0, 49, 98, 196, 294][i],
      mrr: [0, 0, 49, 98, 196, 294][i],
      expenses: [42, 55, 61, 58, 74, 88][i],
      users: [3, 8, 14, 23, 37, 52][i],
    })),
  )

  // ── Links ────────────────────────────────────────────────────────────────
  await db.insert(s.links).values([
    { id: newId(), title: 'Website', url: 'https://example.com', collection: 'startup', icon: 'globe', sortOrder: 0 },
    { id: newId(), title: 'GitHub', url: 'https://github.com', collection: 'startup', icon: 'github', sortOrder: 1 },
    { id: newId(), title: 'Figma', url: 'https://figma.com', collection: 'startup', icon: 'figma', sortOrder: 2 },
    { id: newId(), title: 'Analytics', url: 'https://plausible.io', collection: 'startup', icon: 'chart', sortOrder: 3 },
    { id: newId(), title: 'Stripe', url: 'https://dashboard.stripe.com', collection: 'startup', icon: 'card', sortOrder: 4 },
    { id: newId(), title: 'Drive', url: 'https://drive.google.com', collection: 'startup', icon: 'folder', sortOrder: 5 },
    { id: newId(), title: 'Khan Academy — Accounting & finance', url: 'https://www.khanacademy.org/economics-finance-domain/core-finance', collection: 'study', subjectId: subject.econ, sortOrder: 0 },
    { id: newId(), title: 'Past papers archive', url: 'https://example.com/past-papers', collection: 'study', subjectId: subject.econ, sortOrder: 1 },
    { id: newId(), title: 'GeoGebra', url: 'https://www.geogebra.org', collection: 'study', subjectId: subject.math, sortOrder: 2 },
    { id: newId(), title: 'Figma file — homepage', url: 'https://figma.com', collection: 'project', projectId: project.website, sortOrder: 0 },
  ])

  // ── Calendar (recurring week) ────────────────────────────────────────────
  const base = d(0)
  await db.insert(s.calendarEvents).values([
    { id: newId(), title: 'School', start: at(base, '08:00'), end: at(base, '14:00'), category: 'school', location: 'Institut', repeatWeekdays: [1, 2, 3, 4, 5] },
    { id: newId(), title: 'Lunch', start: at(base, '14:15'), end: at(base, '15:00'), category: 'personal', repeatWeekdays: [0, 1, 2, 3, 4, 5, 6] },
    { id: newId(), title: 'Gym', start: at(base, '17:00'), end: at(base, '18:15'), category: 'health', location: 'Gym', repeatWeekdays: [1, 3, 5, 6] },
    { id: newId(), title: 'Startup deep work', start: at(base, '19:00'), end: at(base, '21:00'), category: 'startup', repeatWeekdays: [1, 2, 3, 4, 6], projectId: project.website },
    { id: newId(), title: 'Weekly review', start: at(base, '18:00'), end: at(base, '18:45'), category: 'personal', repeatWeekdays: [0] },
    { id: newId(), title: 'Call with a potential customer', start: at(d(2), '18:15'), end: at(d(2), '18:45'), category: 'startup', projectId: project.marketing },
    { id: newId(), title: 'Dinner with family', start: at(d(0), '21:15'), end: at(d(0), '22:30'), category: 'personal' },
  ])

  // ── Dashboard + settings ─────────────────────────────────────────────────
  await db.insert(s.dashboardWidgets).values(DEFAULT_WIDGETS.map((w, i) => ({ id: newId(), position: i, ...w })))
  await db.insert(s.settings).values([
    { key: 'userName', value: personal.userName },
    { key: 'startupName', value: personal.startupName },
    { key: 'currency', value: 'EUR' },
  ])
}
