export interface DialogueChoice {
  label: string
  /** The character's reply to this choice. Choices add voice, never skip learning. */
  reply: string
}

export interface DialogueLine {
  speaker: string // character id or 'player'
  text: string
  choices?: DialogueChoice[]
}

export interface StoryScene {
  id: string
  lines: DialogueLine[]
  /** Mission objective shown alongside the dialogue. */
  objective?: string
  /** Optional hint the character can offer. */
  hint?: string
}

export interface Character {
  id: string
  name: string
  role: string
  /** Rendered with the same avatar system as the player. */
  look: import('../avatar').AvatarConfig
}
