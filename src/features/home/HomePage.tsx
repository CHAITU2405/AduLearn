import { Link } from 'react-router'
import { Award, ChevronRight, Compass, Dumbbell, Map as MapIcon, RotateCcw } from 'lucide-react'
import { useRequiredProfile } from '@/app/context'
import { AvatarFigure } from '@/components/avatar/AvatarFigure'
import { Card, EmptyState, LinkButton, Pill, ProgressBar, Spinner } from '@/components/ui'
import { CHAPTERS, conceptName, getBoss, getChapter, getMission, REGIONS } from '@/content'
import type { ChapterNode } from '@/core/content/types'
import { chapterProgress, nextAvailableNode, regionState } from '@/core/game/progression'
import { masteryBand } from '@/core/learning/mastery'
import { useAttempts, useMastery, useRewards, useSnapshot } from '@/data/hooks'

function nodeLink(chapterId: string, node: ChapterNode) {
  if (node.kind === 'mission') return { href: `/mission/${node.id}`, title: getMission(node.id)?.title ?? node.id, kind: 'Mission' }
  if (node.kind === 'boss') return { href: `/boss/${node.id}`, title: getBoss(node.id)?.title ?? node.id, kind: 'Challenge' }
  return { href: `/assessment/${chapterId}/${node.assessment}`, title: node.assessment === 'diagnostic' ? 'Starting check' : 'Follow-up check', kind: 'Check' }
}

export function HomePage() {
  const profile = useRequiredProfile()
  const snapshot = useSnapshot(profile.id)
  const mastery = useMastery(profile.id)
  const rewards = useRewards(profile.id)
  const attempts = useAttempts(profile.id)
  if (!snapshot || !mastery || !rewards || !attempts) return <Spinner />

  const openRegions = REGIONS.filter((r) => regionState(r, CHAPTERS, snapshot) !== 'locked')
  const playable = CHAPTERS.filter((c) => c.status === 'playable' && openRegions.some((r) => r.id === c.regionId))
  const lastChapterId = attempts[0]?.chapterId
  const ordered = [...playable].sort((a, b) => Number(b.id === lastChapterId) - Number(a.id === lastChapterId))
  const next = nextAvailableNode(ordered, snapshot, new Set(attempts.map((a) => a.chapterId)))
  const nextInfo = next ? nodeLink(next.chapter.id, next.node) : null
  const started = attempts.length > 0

  const practise = Object.values(mastery)
    .filter((m) => m.evidence > 0 && masteryBand(m) !== 'secure')
    .sort((a, b) => a.estimate - b.estimate)
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col items-start gap-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-soft via-white to-[#fff4e6] p-6 shadow-soft sm:flex-row sm:items-center sm:p-8">
        <AvatarFigure config={profile.avatar} className="animate-float h-36 w-auto shrink-0" title={`${profile.nickname}'s avatar`} />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-brand-deep">{started ? 'Welcome back,' : 'Hello,'}</p>
          <h1 className="text-4xl font-bold">{profile.nickname}</h1>
          <p className="mt-1 text-ink-soft">{started ? 'Ready for the next part of your journey?' : 'Your adventure is ready. Start by choosing a region on the map.'}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {nextInfo ? (
              <LinkButton to={nextInfo.href} size="lg" variant="warm">
                <Compass className="size-5" aria-hidden /> {started ? 'Continue' : 'Start'}: {nextInfo.title}
              </LinkButton>
            ) : null}
            <LinkButton to="/world" size="lg" variant="secondary">
              <MapIcon className="size-5" aria-hidden /> World map
            </LinkButton>
          </div>
          {next && <p className="mt-2 text-sm text-ink-muted">Next up in {next.chapter.title}.</p>}
        </div>
      </section>

      <section aria-labelledby="journey-heading">
        <h2 id="journey-heading" className="mb-3 text-2xl font-bold">
          Your journey
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {REGIONS.map((r) => {
            const state = regionState(r, CHAPTERS, snapshot)
            const chapters = CHAPTERS.filter((c) => c.regionId === r.id && c.status === 'playable')
            const p = chapters.reduce(
              (acc, c) => {
                const x = chapterProgress(c, snapshot)
                return { done: acc.done + x.done, total: acc.total + x.total }
              },
              { done: 0, total: 0 },
            )
            return (
              <Card as="li" key={r.id} className="flex flex-col gap-2 p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-lg font-bold">{r.subjectLabel}</p>
                  <span className="size-3 rounded-full" style={{ background: r.theme.primary }} aria-hidden />
                </div>
                <p className="text-sm text-ink-muted">{r.name}</p>
                <ProgressBar value={p.done} max={p.total} label={`${r.subjectLabel} progress`} tone={r.id === 'words' ? 'violet' : r.id === 'numbers' ? 'orange' : 'teal'} />
                <p className="text-sm text-ink-soft">{state === 'locked' ? 'Locked — complete any mission to open' : `${p.done} of ${p.total} stages complete`}</p>
                {state !== 'locked' && (
                  <Link to={`/region/${r.id}`} className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-brand-deep hover:underline">
                    Open region <ChevronRight className="size-4" aria-hidden />
                  </Link>
                )}
              </Card>
            )
          })}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Dumbbell className="size-5 text-brand-deep" aria-hidden /> Worth practising
          </h2>
          {practise.length === 0 ? (
            <p className="mt-2 text-ink-soft">
              {started ? 'Nothing stands out right now — keep exploring!' : 'Once you start answering questions, ideas to practise will show up here.'}
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {practise.map((m) => {
                const chapterId = CHAPTERS.find((c) => c.conceptIds.includes(m.conceptId))?.id
                return (
                  <li key={m.conceptId} className="flex items-center justify-between gap-2 rounded-2xl bg-paper p-3">
                    <span className="font-semibold">{conceptName(m.conceptId)}</span>
                    {chapterId && (
                      <LinkButton to={`/practice/${chapterId}?concept=${encodeURIComponent(m.conceptId)}`} size="sm" variant="secondary">
                        Practise
                      </LinkButton>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {started && (
            <Link to="/review" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-deep hover:underline">
              <RotateCcw className="size-4" aria-hidden /> Revisit earlier questions
            </Link>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Award className="size-5 text-[#ca8a04]" aria-hidden /> Milestones
          </h2>
          {rewards.length === 0 ? (
            <EmptyState title="No milestones yet">Milestones are earned by completing missions, fixing mistakes and showing you understand an idea.</EmptyState>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {rewards.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-sun-soft/70 p-3">
                  <Award className="size-5 shrink-0 text-[#ca8a04]" aria-hidden />
                  <span className="min-w-0">
                    <span className="block font-bold">{r.title}</span>
                    <span className="text-xs text-ink-muted">{new Date(r.earnedAt).toLocaleDateString()}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {rewards.length > 5 && (
            <Link to="/progress" className="mt-3 inline-block text-sm font-bold text-brand-deep hover:underline">
              See all {rewards.length}
            </Link>
          )}
        </Card>
      </div>
      {lastChapterId && getChapter(lastChapterId) && (
        <p className="text-sm text-ink-muted">
          Last played: <Pill tone="muted">{getChapter(lastChapterId)!.title}</Pill>
        </p>
      )}
    </div>
  )
}
