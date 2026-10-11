/**
 * Teacher dashboard figures. Real explorers on this device are combined with an
 * optional set of SAMPLE students so the dashboard and leaderboard can be
 * demonstrated before a class has played. Sample rows are always labelled.
 */
import type { Assignment, AssignmentAttempt } from '@/core/assignments'
import { bestAttempt } from '@/core/assignments'
import type { SubjectId } from '@/core/content/types'
import { assignmentRepo, bossRepo, profileRepo, progressRepo, walletRepo, attemptRepo } from '@/data/repositories'

export interface LeaderRow {
  id: string
  name: string
  sample: boolean
  stars: number
  coins: number
  /** Percent of game answers correct (null = no answers yet). */
  accuracy: number | null
  answered: number
  missionsDone: number
  /** Average best score across assignments attempted (null = none). */
  assignmentAvg: number | null
  lastActive: number
}

export interface AssignmentStat {
  assignment: Assignment
  attempted: number
  /** Average of each student's best percent. */
  avgBest: number | null
  perQuestion: { id: string; prompt: string; percentCorrect: number | null }[]
}

export interface DashboardData {
  rows: LeaderRow[]
  realCount: number
  subjectAccuracy: { subject: SubjectId; percent: number | null; answered: number }[]
  /** Answers per day, oldest first, for the last 7 days. */
  activity: { day: string; count: number }[]
  assignments: AssignmentStat[]
}

const DAY = 24 * 3600 * 1000

/** Deterministic sample class (fake names and numbers) for demonstrations. */
const SAMPLE_NAMES = ['Aarav', 'Diya', 'Kabir', 'Ananya', 'Vihaan', 'Isha', 'Reyansh', 'Saanvi', 'Arjun K.', 'Myra', 'Advik', 'Kiara']

function sampleRows(now: number): LeaderRow[] {
  return SAMPLE_NAMES.map((name, i) => {
    const seed = (i * 37 + 11) % 97
    const answered = 25 + ((seed * 7) % 90)
    const accuracy = 52 + ((seed * 13) % 45)
    const missionsDone = 1 + ((seed * 3) % 9)
    return {
      id: `sample-${i}`,
      name,
      sample: true,
      stars: missionsDone * 2 + (seed % 5),
      coins: Math.round(answered * (accuracy / 100) * 10),
      accuracy,
      answered,
      missionsDone,
      assignmentAvg: i % 4 === 3 ? null : 45 + ((seed * 17) % 55),
      lastActive: now - ((seed % 6) + 1) * DAY * 0.7,
    }
  })
}

/** Sample answers per day so the activity chart is not empty in a demo. */
const SAMPLE_ACTIVITY = [34, 41, 18, 52, 47, 29, 38]
const SAMPLE_SUBJECT = { english: [71, 220], mathematics: [64, 260], science: [68, 190] } as const

export async function loadDashboard(includeSample: boolean, now = Date.now()): Promise<DashboardData> {
  const [profiles, assignments, allAttempts] = await Promise.all([profileRepo.list(), assignmentRepo.list(), assignmentRepo.allAttempts()])
  const byStudent = new Map<string, AssignmentAttempt[]>()
  for (const a of allAttempts) byStudent.set(a.profileId, [...(byStudent.get(a.profileId) ?? []), a])

  const subj: Record<SubjectId, { correct: number; total: number }> = {
    english: { correct: 0, total: 0 },
    mathematics: { correct: 0, total: 0 },
    science: { correct: 0, total: 0 },
  }
  const activity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * DAY)
    d.setHours(0, 0, 0, 0)
    return { start: d.getTime(), day: d.toLocaleDateString(undefined, { weekday: 'short' }), count: 0 }
  })

  const real: LeaderRow[] = await Promise.all(
    profiles.map(async (p) => {
      const [attempts, missions, bosses, wallet] = await Promise.all([attemptRepo.forProfile(p.id), progressRepo.forProfile(p.id), bossRepo.forProfile(p.id), walletRepo.get(p.id)])
      for (const a of attempts) {
        const s = subj[a.subject as SubjectId]
        if (s) {
          s.total++
          if (a.correct) s.correct++
        }
        for (const d of activity) if (a.at >= d.start && a.at < d.start + DAY) d.count++
      }
      const stars =
        missions.reduce((n, m) => n + (m.bestStars ?? (m.status === 'completed' ? 1 : 0)), 0) +
        [...new Map(bosses.filter((b) => b.passed).map((b) => [b.bossId, b.stars ?? 1])).values()].reduce((n, s) => n + s, 0)
      const mine = byStudent.get(p.id) ?? []
      const bestPer = [...new Set(mine.map((a) => a.assignmentId))].map((id) => bestAttempt(mine.filter((a) => a.assignmentId === id))!.percent)
      return {
        id: p.id,
        name: p.nickname,
        sample: !!p.demo,
        stars,
        coins: wallet.totalEarned,
        accuracy: attempts.length ? Math.round((attempts.filter((a) => a.correct).length / attempts.length) * 100) : null,
        answered: attempts.length,
        missionsDone: missions.filter((m) => m.status === 'completed').length,
        assignmentAvg: bestPer.length ? Math.round(bestPer.reduce((a, b) => a + b, 0) / bestPer.length) : null,
        lastActive: p.lastActiveAt,
      }
    }),
  )

  const rows = [...real, ...(includeSample ? sampleRows(now) : [])].sort(
    (a, b) => b.stars - a.stars || (b.accuracy ?? -1) - (a.accuracy ?? -1) || b.coins - a.coins || a.name.localeCompare(b.name),
  )

  const subjectAccuracy = (['english', 'mathematics', 'science'] as SubjectId[]).map((s) => {
    let { correct, total } = subj[s]
    if (includeSample) {
      const [pct, n] = SAMPLE_SUBJECT[s]
      correct += Math.round((pct / 100) * n)
      total += n
    }
    return { subject: s, percent: total ? Math.round((correct / total) * 100) : null, answered: total }
  })

  const stats: AssignmentStat[] = assignments.map((a) => {
    const attempts = allAttempts.filter((x) => x.assignmentId === a.id)
    const students = [...new Set(attempts.map((x) => x.profileId))]
    const bests = students.map((s) => bestAttempt(attempts.filter((x) => x.profileId === s))!)
    return {
      assignment: a,
      attempted: students.length,
      avgBest: bests.length ? Math.round(bests.reduce((n, b) => n + b.percent, 0) / bests.length) : null,
      perQuestion: a.questions.map((q) => {
        const rs = bests.map((b) => b.results.find((r) => r.questionId === q.id)).filter((r) => r !== undefined)
        return { id: q.id, prompt: q.prompt, percentCorrect: rs.length ? Math.round((rs.filter((r) => r.correct).length / rs.length) * 100) : null }
      }),
    }
  })

  return {
    rows,
    realCount: real.length,
    subjectAccuracy,
    activity: activity.map((d, i) => ({ day: d.day, count: d.count + (includeSample ? SAMPLE_ACTIVITY[i] : 0) })),
    assignments: stats,
  }
}
