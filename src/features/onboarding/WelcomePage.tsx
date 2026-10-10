import { useNavigate } from 'react-router'
import { BookOpen, Compass, Sparkles, UserRound } from 'lucide-react'
import { useProfile } from '@/app/context'
import { AvatarFigure } from '@/components/avatar/AvatarFigure'
import { Logo } from '@/components/brand/Logo'
import { Card, LinkButton, Notice } from '@/components/ui'
import { HeroScene } from '@/components/world/HeroScene'
import { DEFAULT_AVATAR } from '@/core/avatar'
import { useProfiles } from '@/data/hooks'

const STEPS = [
  { icon: UserRound, title: 'Create your explorer', text: 'Design an avatar and pick a nickname. No real name needed.' },
  { icon: Compass, title: 'Explore the world', text: 'Visit the Kingdom of Words, the Realm of Numbers and the Frontier of Discovery.' },
  { icon: BookOpen, title: 'Learn by solving', text: 'Help characters with real problems. Mistakes come with hints and fresh questions.' },
]

export function WelcomePage() {
  const profiles = useProfiles()
  const { selectProfile } = useProfile()
  const navigate = useNavigate()
  const realProfiles = profiles ?? []

  return (
    <div className="flex flex-col gap-10">
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <Logo className="mb-6 [&_span.text-2xl]:text-4xl [&>span:first-child]:size-14 [&>span:first-child]:text-3xl" />
          <h1 className="text-4xl font-bold sm:text-5xl">
            Your school subjects, <span className="text-brand-deep">as an adventure.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-soft">
            AduLearn turns Class 8 learning into a story. Explore a connected world, meet characters who need your help, and grow your skills one solved challenge at a time.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton to="/start" size="lg" variant="warm">
              <Sparkles className="size-5" aria-hidden /> Start a new adventure
            </LinkButton>
          </div>
        </div>
        <HeroScene avatar={DEFAULT_AVATAR} className="overflow-hidden rounded-[2rem] shadow-lift" />
      </section>

      {realProfiles.length > 0 && (
        <section aria-labelledby="continue-heading">
          <h2 id="continue-heading" className="mb-3 text-2xl font-bold">
            Continue your journey
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {realProfiles.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={async () => {
                    await selectProfile(p.id)
                    navigate('/home')
                  }}
                  className="flex w-full items-center gap-4 rounded-[var(--radius-card)] border-2 border-line bg-white p-3 text-left shadow-soft transition-colors hover:border-brand"
                >
                  <span className="size-16 shrink-0 overflow-hidden rounded-full bg-brand-soft">
                    <AvatarFigure config={p.avatar} variant="portrait" className="size-full" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-xl font-bold">{p.nickname}</span>
                    <span className="text-sm text-ink-muted">Last played {new Date(p.lastActiveAt).toLocaleDateString()}</span>
                    {p.demo && <span className="ml-2 text-xs font-bold text-orange-deep">Demo data</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="mb-3 text-2xl font-bold">
          How it works
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card as="li" key={s.title} className="p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand-deep">
                  <s.icon className="size-6" aria-hidden />
                </span>
                <span className="font-display text-sm font-bold text-ink-muted">Step {i + 1}</span>
              </div>
              <p className="font-display text-xl font-bold">{s.title}</p>
              <p className="mt-1 text-ink-soft">{s.text}</p>
            </Card>
          ))}
        </ol>
      </section>

      <Notice tone="info" title="Your progress stays on this device">
        AduLearn saves everything in this browser — no account or internet connection is needed to play. Clearing browser data removes saved progress, and it does not move to other
        devices automatically. You can export a copy from Settings.
      </Notice>
    </div>
  )
}
