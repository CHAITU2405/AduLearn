import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, Map as MapIcon } from 'lucide-react'
import { useProfile } from '@/app/context'
import { AvatarEditor } from '@/components/avatar/AvatarEditor'
import { AvatarFigure } from '@/components/avatar/AvatarFigure'
import { StoryDialogue } from '@/components/story/StoryDialogue'
import { Button, Card, cn, Notice } from '@/components/ui'
import { HeroScene } from '@/components/world/HeroScene'
import { SCENES } from '@/content'
import { DEFAULT_AVATAR, nicknameSchema, type AvatarConfig } from '@/core/avatar'
import { profileRepo } from '@/data/repositories'

const STEP_LABELS = ['The adventure', 'Your avatar', 'Your nickname', 'Meet your guide']

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [avatar, setAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR)
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { selectProfile } = useProfile()
  const navigate = useNavigate()

  async function save() {
    const parsed = nicknameSchema.safeParse(nickname)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    setSaving(true)
    try {
      const p = await profileRepo.create(parsed.data, avatar)
      // Keep the explorer on this onboarding screen until the guide intro is done.
      setStep(3)
      await selectProfile(p.id)
    } catch (err) {
      setError(`Could not save your explorer: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const finish = useCallback(() => navigate('/world'), [navigate])

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <ol className="flex flex-wrap gap-2" aria-label="Setup steps">
        {STEP_LABELS.map((label, i) => (
          <li
            key={label}
            className={cn('rounded-full px-3 py-1 text-sm font-bold', i === step ? 'bg-brand text-white' : i < step ? 'bg-leaf-soft text-leaf-deep' : 'bg-white text-ink-muted')}
            aria-current={i === step ? 'step' : undefined}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card className="grid gap-6 p-6 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">An adventure made of learning</h1>
            <p className="mt-3 text-lg text-ink-soft">
              The Adventure World has three regions — one for English, one for Mathematics and one for Science. Each region has people who need your help.
            </p>
            <ul className="mt-4 space-y-2 text-ink-soft">
              <li>• Solve challenges to complete missions and unlock new paths.</li>
              <li>• Every question is a fresh variation, so you really learn the idea.</li>
              <li>• Wrong answers come with hints, explanations and another try.</li>
            </ul>
            <Button size="lg" className="mt-6" onClick={() => setStep(1)}>
              Create my explorer <ArrowRight className="size-5" aria-hidden />
            </Button>
          </div>
          <HeroScene avatar={avatar} className="overflow-hidden rounded-3xl" />
        </Card>
      )}

      {step === 1 && (
        <Card className="p-6">
          <h1 className="mb-1 text-3xl font-bold">Design your explorer</h1>
          <p className="mb-6 text-ink-soft">Pick a look you like. You can change it later in Settings.</p>
          <AvatarEditor value={avatar} onChange={setAvatar} />
          <div className="mt-8 flex justify-between gap-2">
            <Button variant="ghost" onClick={() => setStep(0)}>
              <ArrowLeft className="size-5" aria-hidden /> Back
            </Button>
            <Button size="lg" onClick={() => setStep(2)}>
              Next <ArrowRight className="size-5" aria-hidden />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="grid gap-6 p-6 md:grid-cols-[12rem_1fr] md:items-center">
          <AvatarFigure config={avatar} className="mx-auto h-56 w-auto" title="Your avatar" />
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void save()
            }}
          >
            <h1 className="text-3xl font-bold">Choose a nickname</h1>
            <p className="mt-1 text-ink-soft">This is what characters will call you. It does not need to be your real name — please don’t use your full name.</p>
            <label htmlFor="nickname" className="mt-5 block font-bold">
              Nickname
            </label>
            <input
              id="nickname"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value)
                setError(null)
              }}
              maxLength={20}
              autoComplete="off"
              aria-invalid={!!error}
              aria-describedby={error ? 'nickname-error' : 'nickname-help'}
              className="mt-1 min-h-14 w-full max-w-sm rounded-2xl border-2 border-line bg-white px-4 text-xl font-bold outline-none focus:border-brand"
              placeholder="e.g. StarTrekker"
            />
            <p id="nickname-help" className="mt-1 text-sm text-ink-muted">
              2–20 letters or numbers.
            </p>
            {error && (
              <p id="nickname-error" className="mt-2 font-semibold text-coral-deep" role="alert">
                {error}
              </p>
            )}
            <Notice tone="info" className="mt-5">
              Your explorer is saved in this browser only. No email, phone number or location is collected.
            </Notice>
            <div className="mt-6 flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="size-5" aria-hidden /> Back
              </Button>
              <Button type="submit" size="lg" variant="warm" disabled={saving}>
                {saving ? 'Saving…' : 'Save my explorer'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Welcome, {nickname.trim()}!</h1>
          <StoryDialogue scene={SCENES.welcome} playerAvatar={avatar} playerName={nickname.trim()} onDone={finish} doneLabel="Open the world map" />
          <Button variant="ghost" className="self-start" onClick={finish}>
            <MapIcon className="size-5" aria-hidden /> Go straight to the map
          </Button>
        </div>
      )}
    </div>
  )
}
