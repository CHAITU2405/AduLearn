/**
 * Rewards mark meaningful learning milestones only. There are no streaks,
 * random drops, or rewards for time spent.
 */
export type RewardKind = 'mission-complete' | 'misconception-corrected' | 'concept-secure' | 'chapter-complete' | 'boss-defeated' | 'assessment-improved'

export interface RewardDraft {
  kind: RewardKind
  /** Unique per profile + kind, so a milestone can only be earned once. */
  refId: string
  title: string
  description: string
}

export function missionReward(missionId: string, missionTitle: string): RewardDraft {
  return { kind: 'mission-complete', refId: missionId, title: `${missionTitle} complete`, description: 'Finished every goal in this mission.' }
}

export function bossReward(bossId: string, bossName: string, tier: 'mini' | 'chapter'): RewardDraft {
  return {
    kind: 'boss-defeated',
    refId: bossId,
    title: `${bossName} ${tier === 'chapter' ? 'overcome' : 'outwitted'}`,
    description: 'Applied several ideas together in a cumulative challenge.',
  }
}

export function chapterReward(chapterId: string, chapterTitle: string): RewardDraft {
  return { kind: 'chapter-complete', refId: chapterId, title: `${chapterTitle} chapter cleared`, description: 'Completed every mission and the chapter boss.' }
}

export function conceptSecureReward(conceptId: string, conceptName: string): RewardDraft {
  return {
    kind: 'concept-secure',
    refId: conceptId,
    title: `Steady with ${conceptName}`,
    description: 'Solved several different questions on this idea without hints.',
  }
}

export function comebackReward(conceptId: string, misconceptionId: string, conceptName: string): RewardDraft {
  return {
    kind: 'misconception-corrected',
    refId: `${conceptId}:${misconceptionId}`,
    title: `Comeback: ${conceptName}`,
    description: 'Fixed an earlier mistake and then solved a new question on your own.',
  }
}

export function assessmentImprovedReward(chapterId: string, chapterTitle: string): RewardDraft {
  return {
    kind: 'assessment-improved',
    refId: chapterId,
    title: `Grew in ${chapterTitle}`,
    description: 'Scored higher on the follow-up check than on the starting check.',
  }
}
