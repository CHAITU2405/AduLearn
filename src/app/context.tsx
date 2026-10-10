import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { MotionConfig } from 'framer-motion'
import type { ProfileRecord } from '@/data/db'
import { getDb } from '@/data/db'
import { profileRepo, settingsRepo } from '@/data/repositories'
import { applyPrefsToDocument, loadPrefs, savePrefs, type Prefs } from '@/lib/prefs'

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

interface PrefsCtx {
  prefs: Prefs
  setPrefs: (update: (p: Prefs) => Prefs) => void
}

const PrefsContext = createContext<PrefsCtx | null>(null)

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setState] = useState<Prefs>(() => loadPrefs())
  useEffect(() => applyPrefsToDocument(prefs), [prefs])
  const setPrefs = useCallback((update: (p: Prefs) => Prefs) => {
    setState((prev) => {
      const next = update(prev)
      savePrefs(next)
      return next
    })
  }, [])
  const reduced = prefs.motion === 'reduce' ? 'always' : prefs.motion === 'full' ? 'never' : 'user'
  return (
    <PrefsContext.Provider value={{ prefs, setPrefs }}>
      <MotionConfig reducedMotion={reduced}>{children}</MotionConfig>
    </PrefsContext.Provider>
  )
}

export function usePrefs(): PrefsCtx {
  const ctx = useContext(PrefsContext)
  if (!ctx) throw new Error('usePrefs must be used inside PrefsProvider')
  return ctx
}

// ---------------------------------------------------------------------------
// Active profile
// ---------------------------------------------------------------------------

interface ProfileCtx {
  /** undefined while loading, null when no profile is active. */
  profile: ProfileRecord | null | undefined
  selectProfile: (id: string | null) => Promise<void>
}

const ProfileContext = createContext<ProfileCtx | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const profile = useLiveQuery(async () => {
    const id = (await getDb().settings.get('activeProfileId'))?.value as string | null | undefined
    if (!id) return null
    return (await getDb().profiles.get(id)) ?? null
  }, [])
  const selectProfile = useCallback(async (id: string | null) => {
    await settingsRepo.set('activeProfileId', id)
    if (id) await profileRepo.touch(id)
  }, [])
  const value = useMemo(() => ({ profile, selectProfile }), [profile, selectProfile])
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile(): ProfileCtx {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider')
  return ctx
}

/** For screens that require a profile (guarded by the router). */
export function useRequiredProfile(): ProfileRecord {
  const { profile } = useProfile()
  if (!profile) throw new Error('No active profile')
  return profile
}
