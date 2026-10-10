/** Live React hooks over the repository layer (re-render when IndexedDB changes). */
import { useLiveQuery } from 'dexie-react-hooks'
import type { ReviewStatus } from '@/core/content/types'
import { emptySnapshot } from '@/core/game/progression'
import { assessmentRepo, attemptRepo, bossRepo, masteryRepo, profileRepo, progressRepo, progressSnapshot, reviewRepo, rewardRepo } from './repositories'

export const useSnapshot = (profileId: string | undefined) => useLiveQuery(() => (profileId ? progressSnapshot(profileId) : Promise.resolve(emptySnapshot())), [profileId])

export const useMastery = (profileId: string) => useLiveQuery(() => masteryRepo.forProfile(profileId), [profileId])
export const useAttempts = (profileId: string) => useLiveQuery(() => attemptRepo.forProfile(profileId), [profileId])
export const useRewards = (profileId: string) => useLiveQuery(() => rewardRepo.forProfile(profileId), [profileId])
export const useBossResults = (profileId: string) => useLiveQuery(() => bossRepo.forProfile(profileId), [profileId])
export const useAssessments = (profileId: string) => useLiveQuery(() => assessmentRepo.forProfile(profileId), [profileId])
export const useMissionProgress = (profileId: string) => useLiveQuery(() => progressRepo.forProfile(profileId), [profileId])
export const useProfiles = () => useLiveQuery(() => profileRepo.list(), [])
export const useReviewOverrides = () => useLiveQuery<Record<string, ReviewStatus>>(() => reviewRepo.overrides(), [])
export const useReviewRecords = () => useLiveQuery(() => reviewRepo.all(), [])
