import { NavLink, Outlet, Link, useLocation } from 'react-router'
import { BarChart3, ClipboardList, Home, Map, RotateCcw, Settings } from 'lucide-react'
import { Suspense, useEffect } from 'react'
import { PortraitFill } from '@/components/story/CharacterSprite'
import { Logo } from '@/components/brand/Logo'
import { cn, Spinner } from '@/components/ui'
import { useProfile } from './context'

const NAV = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/world', label: 'World map', icon: Map },
  { to: '/progress', label: 'My progress', icon: BarChart3 },
  { to: '/review', label: 'Review', icon: RotateCcw },
  { to: '/assignments', label: 'Assignments', icon: ClipboardList },
]

export function AppShell() {
  const { profile } = useProfile()
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only-focusable fixed left-3 top-3 z-50 rounded-full bg-ink px-4 py-2 font-bold text-white">
        Skip to content
      </a>
      <header className="no-print sticky top-0 z-30 border-b border-line/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:gap-4">
          <Link to={profile ? '/home' : '/'} className="shrink-0 rounded-xl" aria-label="AduLearn home">
            <Logo compact className="[&_span.text-2xl]:text-xl max-sm:[&>span:last-child]:hidden sm:[&_span.text-2xl]:text-2xl" />
          </Link>
          {profile && (
            <nav aria-label="Main" className="ml-auto flex items-center gap-0.5 sm:gap-1">
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  aria-label={label}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex min-h-11 min-w-10 items-center justify-center gap-1.5 rounded-full px-2 font-bold transition-colors sm:min-w-11 sm:px-3',
                      isActive ? 'bg-brand-soft text-brand-deep' : 'text-ink-soft hover:bg-paper',
                    )
                  }
                >
                  <Icon className="size-5" aria-hidden />
                  <span className="hidden lg:inline">{label}</span>
                </NavLink>
              ))}
              <NavLink
                to="/settings"
                aria-label={`Settings for ${profile.nickname}`}
                className="ml-1 inline-flex items-center gap-2 rounded-full border-2 border-line bg-white py-0.5 pl-0.5 pr-0.5 hover:border-brand sm:pr-3"
              >
                <span className="size-9 overflow-hidden rounded-full bg-brand-soft">
                  <PortraitFill speaker="player" avatar={profile.avatar} />
                </span>
                <span className="hidden max-w-28 truncate font-bold sm:inline">{profile.nickname}</span>
                <Settings className="hidden size-4 text-ink-muted sm:inline" aria-hidden />
              </NavLink>
            </nav>
          )}
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="no-print border-t border-line/70 bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-ink-muted">
          <p>
            AduLearn · Adventure Education Learning <span aria-hidden>·</span> <span className="whitespace-nowrap">made by Team Spidey</span>
          </p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1 font-semibold">
            <Link to="/about" className="hover:text-brand-deep">
              About
            </Link>
            <Link to="/teacher" className="hover:text-brand-deep">
              Teacher view
            </Link>
            <Link to="/settings" className="hover:text-brand-deep">
              Settings &amp; data
            </Link>
          </nav>
          <p className="w-full text-xs">Progress is saved in this browser on this device only. Clearing browser data removes it — use Settings → Export to keep a copy.</p>
        </div>
      </footer>
    </div>
  )
}
