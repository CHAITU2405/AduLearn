import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Download, FlaskConical, LogOut, Save, Sparkles, Trash2, Upload, UserRoundPen } from 'lucide-react'
import { usePrefs, useProfile } from '@/app/context'
import { AvatarEditor } from '@/components/avatar/AvatarEditor'
import { HeroPicker } from '@/components/avatar/HeroPicker'
import { Button, Card, ConfirmDialog, Notice, PageHeader } from '@/components/ui'
import { nicknameSchema, type AvatarConfig } from '@/core/avatar'
import { buildExport, downloadJson, importBundle, parseImport } from '@/data/exportImport'
import { clearAllData, profileRepo, walletRepo } from '@/data/repositories'
import { useLiveQuery } from 'dexie-react-hooks'
import { listModels, OllamaFailure } from '@/services/ai/ollama'
import { createDemoProfile, removeDemoProfiles } from '@/services/demo'

export function SettingsPage() {
  const { profile } = useProfile()
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader eyebrow="Settings" title="Settings & data" />
      {profile && <ExplorerSection key={profile.id} />}
      <PreferencesSection />
      <DataSection />
      <AiSection />
      {(import.meta.env.DEV || new URLSearchParams(location.search).has('dev')) && <DemoSection />}
    </div>
  )
}

function ExplorerSection() {
  const { profile, selectProfile } = useProfile()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [avatar, setAvatar] = useState<AvatarConfig>(profile!.avatar)
  const [nickname, setNickname] = useState(profile!.nickname)
  const wallet = useLiveQuery(() => walletRepo.get(profile!.id), [profile!.id])
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const p = profile!

  async function save() {
    const parsed = nicknameSchema.safeParse(nickname)
    if (!parsed.success) return setMsg({ tone: 'error', text: parsed.error.issues[0].message })
    await profileRepo.update(p.id, { avatar, nickname: parsed.data })
    setMsg({ tone: 'success', text: 'Your explorer has been updated.' })
    setEditing(false)
  }

  return (
    <Card as="section" className="p-6">
      <h2 className="text-2xl font-bold">Your explorer</h2>
      <p className="mt-1 text-ink-soft">Your avatar is kept between visits. Change it here whenever you like.</p>
      {msg && (
        <Notice tone={msg.tone} className="mt-4">
          {msg.text}
        </Notice>
      )}
      {editing ? (
        <div className="mt-5 flex flex-col gap-5">
          <div>
            <label htmlFor="nick" className="font-bold">
              Nickname
            </label>
            <input
              id="nick"
              value={nickname}
              maxLength={20}
              onChange={(e) => setNickname(e.target.value)}
              className="mt-1 block min-h-12 w-full max-w-sm rounded-2xl border-2 border-line px-4 font-bold outline-none focus:border-brand"
            />
          </div>
          <div>
            <p className="mb-2 font-bold">Your hero</p>
            <HeroPicker value={avatar} onChange={setAvatar} />
          </div>
          <p className="font-bold">Your explorer on the map</p>
          <AvatarEditor value={avatar} onChange={(v) => setAvatar({ ...v, hero: avatar.hero })} name={nickname} owned={wallet?.owned ?? []} />
          <div className="flex gap-2">
            <Button onClick={() => void save()}>
              <Save className="size-4" aria-hidden /> Save changes
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(false)
                setAvatar(p.avatar)
                setNickname(p.nickname)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <UserRoundPen className="size-4" aria-hidden /> Edit avatar & nickname
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await selectProfile(null)
              navigate('/')
            }}
          >
            <LogOut className="size-4" aria-hidden /> Switch explorer
          </Button>
          <Button variant="ghost" className="text-coral-deep" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" aria-hidden /> Delete this explorer
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${p.nickname}?`}
        confirmLabel="Delete explorer and progress"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false)
          await profileRepo.remove(p.id)
          navigate('/')
        }}
      >
        This permanently removes this explorer and all of their answers, progress and milestones from this browser. Consider exporting a copy first. This cannot be undone.
      </ConfirmDialog>
    </Card>
  )
}

function PreferencesSection() {
  const { prefs, setPrefs } = usePrefs()
  return (
    <Card as="section" className="p-6">
      <h2 className="text-2xl font-bold">Comfort & accessibility</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <fieldset>
          <legend className="font-bold">Animations</legend>
          {(['system', 'reduce', 'full'] as const).map((m) => (
            <label key={m} className="mt-2 flex min-h-11 items-center gap-2">
              <input type="radio" name="motion" checked={prefs.motion === m} onChange={() => setPrefs((p) => ({ ...p, motion: m }))} className="size-5 accent-brand" />
              {m === 'system' ? 'Follow my device setting' : m === 'reduce' ? 'Reduce motion' : 'Allow animations'}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend className="font-bold">Text size</legend>
          {(['normal', 'large'] as const).map((s) => (
            <label key={s} className="mt-2 flex min-h-11 items-center gap-2">
              <input type="radio" name="text" checked={prefs.textSize === s} onChange={() => setPrefs((p) => ({ ...p, textSize: s }))} className="size-5 accent-brand" />
              {s === 'normal' ? 'Normal' : 'Larger text'}
            </label>
          ))}
        </fieldset>
        <label className="flex min-h-11 items-center gap-2 sm:col-span-2">
          <input type="checkbox" checked={prefs.showReasons} onChange={(e) => setPrefs((p) => ({ ...p, showReasons: e.target.checked }))} className="size-5 accent-brand" />
          Show “Why this question?” explanations during missions
        </label>
      </div>
    </Card>
  )
}

function DataSection() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<{ text: string; summary: string } | null>(null)
  const [msg, setMsg] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const navigate = useNavigate()

  async function onFile(file: File) {
    if (file.size > 25 * 1024 * 1024) return setMsg({ tone: 'error', text: 'That file is too large to be an AduLearn export.' })
    const text = await file.text()
    const parsed = parseImport(text)
    if (!parsed.ok) return setMsg({ tone: 'error', text: `This file can’t be imported: ${parsed.errors.join('; ')}` })
    const b = parsed.bundle
    setPending({
      text,
      summary: `${b.profiles.length} explorer(s): ${b.profiles.map((p) => p.nickname).join(', ')} — ${b.attempts.length} answers, exported ${new Date(b.exportedAt).toLocaleString()}.`,
    })
  }

  return (
    <Card as="section" className="p-6">
      <h2 className="text-2xl font-bold">Your data on this device</h2>
      <Notice tone="warn" className="mt-3" title="Saved in this browser only">
        <ul className="list-disc pl-4">
          <li>Progress belongs to this browser profile on this device.</li>
          <li>Clearing browser data (or using a private window) can remove it.</li>
          <li>It does not move to another device automatically — export and import a file to move it.</li>
          <li>Browser storage is not a secure backup. Keep exported files somewhere safe.</li>
        </ul>
      </Notice>
      {msg && (
        <Notice tone={msg.tone} className="mt-3">
          {msg.text}
        </Notice>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={async () => {
            const data = await buildExport()
            downloadJson(`adulearn-progress-${new Date().toISOString().slice(0, 10)}.json`, data)
            setMsg({ tone: 'success', text: `Exported ${data.profiles.length} explorer(s) and ${data.attempts.length} answers.` })
          }}
        >
          <Download className="size-4" aria-hidden /> Export progress (JSON)
        </Button>
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" aria-hidden /> Import progress
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Choose an AduLearn export file"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onFile(f)
            e.target.value = ''
          }}
        />
        <Button variant="ghost" className="text-coral-deep" onClick={() => setConfirmReset(true)}>
          <Trash2 className="size-4" aria-hidden /> Erase all data
        </Button>
      </div>
      <ConfirmDialog
        open={!!pending}
        danger={false}
        title="Import this file?"
        confirmLabel="Import"
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          const text = pending!.text
          setPending(null)
          const res = await importBundle(text)
          setMsg(
            res.ok
              ? {
                  tone: 'success',
                  text: `Imported ${res.profilesAdded} explorer(s) and ${res.recordsAdded} records.${res.profilesSkipped ? ` ${res.profilesSkipped} explorer(s) already on this device were left unchanged.` : ''}`,
                }
              : { tone: 'error', text: res.errors.join('; ') },
          )
        }}
      >
        <p>{pending?.summary}</p>
        <p className="mt-2">Explorers that already exist on this device are never overwritten.</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={confirmReset}
        title="Erase all AduLearn data?"
        confirmLabel="Erase everything"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          setConfirmReset(false)
          await clearAllData()
          navigate('/')
        }}
      >
        This deletes every explorer, answer, progress record, milestone and teacher setting stored in this browser. Export first if you want a copy. This cannot be undone.
      </ConfirmDialog>
    </Card>
  )
}

function AiSection() {
  const { prefs, setPrefs } = usePrefs()
  const [models, setModels] = useState<string[] | null>(null)
  const [status, setStatus] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const ai = prefs.ai

  async function test() {
    setTesting(true)
    setStatus({ tone: 'info', text: 'Checking for Ollama…' })
    try {
      const list = await listModels(ai)
      setModels(list)
      setStatus(
        list.length
          ? { tone: 'success', text: `Connected. ${list.length} model(s) installed.` }
          : { tone: 'info', text: 'Connected, but no models are installed. Install one with “ollama pull <model>”.' },
      )
    } catch (err) {
      setModels(null)
      setStatus({ tone: 'error', text: err instanceof OllamaFailure ? err.message : 'Could not reach Ollama.' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card as="section" className="p-6">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <Sparkles className="size-6 text-[#4338ca]" aria-hidden /> Optional local AI (Ollama)
      </h2>
      <p className="mt-1 text-ink-soft">
        AduLearn works fully without AI. If Ollama runs on this computer, it can offer extra hints, alternative explanations and dialogue variations. It never checks answers or
        decides progress, and no explorer details are sent to it.
      </p>
      <label className="mt-4 flex min-h-11 items-center gap-2 font-bold">
        <input type="checkbox" checked={ai.enabled} onChange={(e) => setPrefs((p) => ({ ...p, ai: { ...p.ai, enabled: e.target.checked } }))} className="size-5 accent-brand" />
        Use local AI features
      </label>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ai-endpoint" className="font-bold">
            Ollama address
          </label>
          <input
            id="ai-endpoint"
            value={ai.endpoint}
            onChange={(e) => setPrefs((p) => ({ ...p, ai: { ...p.ai, endpoint: e.target.value } }))}
            className="mt-1 block min-h-11 w-full rounded-xl border-2 border-line px-3 outline-none focus:border-brand"
          />
        </div>
        <div>
          <label htmlFor="ai-model" className="font-bold">
            Model
          </label>
          {models && models.length > 0 ? (
            <select
              id="ai-model"
              value={ai.model}
              onChange={(e) => setPrefs((p) => ({ ...p, ai: { ...p.ai, model: e.target.value } }))}
              className="mt-1 block min-h-11 w-full rounded-xl border-2 border-line bg-white px-3 outline-none focus:border-brand"
            >
              <option value="">Choose a model…</option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="ai-model"
              value={ai.model}
              placeholder="e.g. llama3.2:3b"
              onChange={(e) => setPrefs((p) => ({ ...p, ai: { ...p.ai, model: e.target.value.trim() } }))}
              className="mt-1 block min-h-11 w-full rounded-xl border-2 border-line px-3 outline-none focus:border-brand"
            />
          )}
        </div>
        <div>
          <label htmlFor="ai-timeout" className="font-bold">
            Time limit (seconds)
          </label>
          <input
            id="ai-timeout"
            type="number"
            min={3}
            max={120}
            value={Math.round(ai.timeoutMs / 1000)}
            onChange={(e) => setPrefs((p) => ({ ...p, ai: { ...p.ai, timeoutMs: Math.min(120, Math.max(3, Number(e.target.value) || 20)) * 1000 } }))}
            className="mt-1 block min-h-11 w-32 rounded-xl border-2 border-line px-3 outline-none focus:border-brand"
          />
        </div>
      </div>
      <Button variant="secondary" className="mt-4" onClick={() => void test()} disabled={testing}>
        {testing ? 'Testing…' : 'Test connection'}
      </Button>
      {status && (
        <Notice tone={status.tone} className="mt-3">
          {status.text}
        </Notice>
      )}
      <p className="mt-3 text-xs text-ink-muted">
        Models are never downloaded automatically. If the browser cannot reach Ollama, allow this site with the OLLAMA_ORIGINS setting (see README).
      </p>
    </Card>
  )
}

function DemoSection() {
  const [msg, setMsg] = useState<string | null>(null)
  return (
    <Card as="section" className="border-2 border-dashed border-orange p-6">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <FlaskConical className="size-6 text-orange-deep" aria-hidden /> Developer: demo data
      </h2>
      <p className="mt-1 text-ink-soft">
        Creates a clearly labelled “Demo Explorer” with simulated answers so the teacher view can be shown. Demo records are marked as demo data everywhere.
      </p>
      {msg && (
        <Notice tone="info" className="mt-3">
          {msg}
        </Notice>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={async () => {
            await createDemoProfile()
            setMsg('Demo Explorer created.')
          }}
        >
          Create demo explorer
        </Button>
        <Button
          variant="ghost"
          onClick={async () => {
            const n = await removeDemoProfiles()
            setMsg(`Removed ${n} demo explorer(s).`)
          }}
        >
          Remove demo explorers
        </Button>
      </div>
    </Card>
  )
}
