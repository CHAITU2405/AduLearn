import { useEffect, useState } from 'react'
import { BookCheck, ClipboardList, Gauge, KeyRound, LayoutDashboard, Lock, ShieldCheck, UserRound } from 'lucide-react'
import { Button, Card, cn, Notice, PageHeader, Spinner } from '@/components/ui'
import { Assignments } from './Assignments'
import { ContentReview } from './ContentReview'
import { Dashboard } from './Dashboard'
import { Overview } from './Overview'
import { checkPin, hasPin, rememberUnlocked, setPin, validPin, wasUnlocked } from './pin'
import { StudentDetail } from './StudentDetail'

type Tab = 'dashboard' | 'assignments' | 'overview' | 'student' | 'content'

export function TeacherPage() {
  const [pinExists, setPinExists] = useState<boolean | null>(null)
  const [unlocked, setUnlocked] = useState(wasUnlocked())
  const [tab, setTab] = useState<Tab>('dashboard')
  const [studentId, setStudentId] = useState<string | null>(null)
  useEffect(() => {
    void hasPin().then(setPinExists)
  }, [])

  if (pinExists === null) return <Spinner />
  if (!unlocked)
    return (
      <PinGate
        firstTime={!pinExists}
        onUnlock={() => {
          setUnlocked(true)
          rememberUnlocked(true)
        }}
      />
    )

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Gauge },
    { id: 'assignments', label: 'Assignments', icon: BookCheck },
    { id: 'overview', label: 'Explorers', icon: LayoutDashboard },
    { id: 'student', label: 'Student detail', icon: UserRound },
    { id: 'content', label: 'Content review', icon: ClipboardList },
  ]
  return (
    <div>
      <div className="no-print">
        <PageHeader
          eyebrow="Teacher view (this device)"
          title="Teacher dashboard"
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setUnlocked(false)
                rememberUnlocked(false)
              }}
            >
              <Lock className="size-4" aria-hidden /> Lock
            </Button>
          }
        >
          Scores, a leaderboard and assignments for the explorers who play in this browser. Only someone with the teacher PIN can open this view.
        </PageHeader>
        <div role="tablist" aria-label="Teacher sections" className="mb-6 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-bold',
                tab === t.id ? 'bg-ink text-white' : 'bg-white text-ink-soft hover:bg-brand-soft',
              )}
            >
              <t.icon className="size-4" aria-hidden /> {t.label}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel">
        {tab === 'dashboard' && <Dashboard onOpenAssignments={() => setTab('assignments')} />}
        {tab === 'assignments' && <Assignments />}
        {tab === 'overview' && (
          <Overview
            onOpenStudent={(id) => {
              setStudentId(id)
              setTab('student')
            }}
          />
        )}
        {tab === 'student' && <StudentDetail selectedId={studentId} onSelect={setStudentId} />}
        {tab === 'content' && <ContentReview />}
      </div>
    </div>
  )
}

function PinGate({ firstTime, onUnlock }: { firstTime: boolean; onUnlock: () => void }) {
  const [pin, setPinValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (!validPin(pin)) return setError('Use 4 to 8 digits.')
    if (firstTime) {
      if (pin !== confirm) return setError('The two PINs do not match.')
      await setPin(pin)
      onUnlock()
    } else if (await checkPin(pin)) onUnlock()
    else setError('That PIN is not correct.')
  }

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <KeyRound className="size-7 text-brand-deep" aria-hidden /> Teacher view
        </h1>
        <p className="mt-2 text-ink-soft">{firstTime ? 'Set a PIN for the teacher view on this device.' : 'Enter the teacher PIN for this device.'}</p>
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <label htmlFor="pin" className="font-bold">
            PIN
          </label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => setPinValue(e.target.value)}
            className="min-h-12 rounded-2xl border-2 border-line px-4 text-xl tracking-widest outline-none focus:border-brand"
          />
          {firstTime && (
            <>
              <label htmlFor="pin2" className="font-bold">
                Confirm PIN
              </label>
              <input
                id="pin2"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="min-h-12 rounded-2xl border-2 border-line px-4 text-xl tracking-widest outline-none focus:border-brand"
              />
            </>
          )}
          {error && (
            <p className="font-semibold text-coral-deep" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" size="lg">
            {firstTime ? 'Set PIN and open' : 'Open teacher view'}
          </Button>
        </form>
        <Notice tone="info" className="mt-5">
          <span className="inline-flex items-center gap-1 font-bold">
            <ShieldCheck className="size-4" aria-hidden /> About this PIN
          </span>
          <br />
          The PIN keeps students from opening this view by accident. It is not strong security: anyone with full access to this device and browser can still read or erase local
          data.
        </Notice>
      </Card>
    </div>
  )
}
