import { lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from 'react-router'
import { Notice, Spinner } from '@/components/ui'
import { openDatabase, type DbStatus } from '@/data/db'
import { WelcomePage } from '@/features/onboarding/WelcomePage'
import { ChapterPage } from '@/features/world/ChapterPage'
import { WorldPage } from '@/features/world/WorldPage'
import { AppShell } from './AppShell'

// Less frequently used screens are split into separate chunks.
const named = <K extends string>(load: () => Promise<Record<K, ComponentType>>, key: K) => lazy(() => load().then((m) => ({ default: m[key] })))
const AboutPage = named(() => import('@/features/about/AboutPage'), 'AboutPage')
const AssessmentPage = named(() => import('@/features/assessment/AssessmentPage'), 'AssessmentPage')
const ProgressPage = named(() => import('@/features/progress/ProgressPage'), 'ProgressPage')
const ReviewPage = named(() => import('@/features/review/ReviewPage'), 'ReviewPage')
const SettingsPage = named(() => import('@/features/settings/SettingsPage'), 'SettingsPage')
const BossPage = named(() => import('@/features/boss/BossPage'), 'BossPage')
const MissionPage = named(() => import('@/features/mission/MissionPage'), 'MissionPage')
const PracticePage = named(() => import('@/features/mission/PracticePage'), 'PracticePage')
const OnboardingPage = named(() => import('@/features/onboarding/OnboardingPage'), 'OnboardingPage')
const RegionPage = named(() => import('@/features/world/RegionPage'), 'RegionPage')
const BackpackPage = named(() => import('@/features/backpack/BackpackPage'), 'BackpackPage')
const TeacherPage = named(() => import('@/features/teacher/TeacherPage'), 'TeacherPage')
import { PrefsProvider, ProfileProvider, useProfile } from './context'

function RequireProfile({ children }: { children: ReactNode }) {
  const { profile } = useProfile()
  const location = useLocation()
  if (profile === undefined) return <Spinner label="Loading your adventure" />
  if (!profile) return <Navigate to="/" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

function Landing() {
  const { profile } = useProfile()
  if (profile === undefined) return <Spinner label="Loading your adventure" />
  return profile ? <Navigate to="/world" replace /> : <WelcomePage />
}

function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-3xl font-bold">This path is not on the map</h1>
      <p className="mt-2 text-ink-soft">The page you were looking for does not exist.</p>
      <a href="/" className="mt-6 inline-block font-bold text-brand-deep underline">
        Back to the start
      </a>
    </div>
  )
}

const guard = (el: ReactNode) => <RequireProfile>{el}</RequireProfile>

function GameShell() {
  return (
    <Suspense fallback={<Spinner />}>
      <Outlet />
    </Suspense>
  )
}

const router = createBrowserRouter([
  {
    // Full-screen game layer (no portal header/footer).
    element: <GameShell />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/start', element: <OnboardingPage /> },
      { path: '/world', element: guard(<WorldPage />) },
      { path: '/backpack', element: guard(<BackpackPage />) },
      { path: '/region/:regionId', element: guard(<RegionPage />) },
      { path: '/mission/:missionId', element: guard(<MissionPage />) },
      { path: '/practice/:chapterId', element: guard(<PracticePage />) },
      { path: '/boss/:bossId', element: guard(<BossPage />) },
    ],
  },
  {
    element: <AppShell />,
    children: [
      { path: '/home', element: <Navigate to="/world" replace /> },
      { path: '/chapter/:chapterId', element: guard(<ChapterPage />) },
      { path: '/assessment/:chapterId/:kind', element: guard(<AssessmentPage />) },
      { path: '/review', element: guard(<ReviewPage />) },
      { path: '/progress', element: guard(<ProgressPage />) },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/teacher', element: <TeacherPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export function App() {
  const [db, setDb] = useState<DbStatus | null>(null)
  useEffect(() => {
    void openDatabase().then(setDb)
  }, [])
  if (!db) return <Spinner label="Opening local storage" />
  if (!db.ok) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <h1 className="mb-4 text-3xl font-bold">AduLearn could not start</h1>
        <Notice tone="error" title="Local storage is unavailable">
          <p>{db.message}</p>
          <p className="mt-2">AduLearn saves progress in your browser. Try a normal (non-private) window, or allow site data for this page, then reload.</p>
        </Notice>
      </div>
    )
  }
  return (
    <PrefsProvider>
      <ProfileProvider>
        <RouterProvider router={router} />
      </ProfileProvider>
    </PrefsProvider>
  )
}
