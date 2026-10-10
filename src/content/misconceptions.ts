/** Teacher-facing labels for misconception ids used by question templates. */
export const MISCONCEPTIONS: Record<string, { label: string; reteach: string }> = {
  'math.inverse-operation': { label: 'Used the same operation instead of its inverse', reteach: 'Model “undoing” with a balance: + undoes −, × undoes ÷.' },
  'math.undo-order': { label: 'Undid operations in the wrong order', reteach: 'Undo in reverse order: deal with + / − before × / ÷.' },
  'math.sign-error': { label: 'Sign error when moving a term', reteach: 'Emphasise “do the same to both sides” rather than “move and change sign”.' },
  'math.equation-setup': { label: 'Set up the equation incorrectly from a story', reteach: 'Practise naming the unknown and writing each quantity in terms of x.' },
  'math.partial-solution': { label: 'Answered a different quantity than asked', reteach: 'Encourage re-reading the question after solving.' },
  'math.balance': { label: 'Changed only one side of the equation', reteach: 'Use a physical or drawn balance scale.' },
  'eng.overregularisation': { label: 'Added -ed to an irregular verb', reteach: 'Review common irregular past forms in context.' },
  'eng.tense-mismatch': { label: 'Verb tense did not match the time marker', reteach: 'Highlight time markers (yesterday, last week) and match tense.' },
  'eng.vowel-letter-rule': { label: 'Chose a/an by letter rather than sound', reteach: 'Say words aloud: hour, honest, university, one.' },
  'eng.definite-article': { label: 'Did not use “the” for a known referent', reteach: 'First mention → a/an; later mention → the.' },
  'eng.subject-verb-agreement': { label: 'Subject–verb agreement', reteach: 'Identify the subject, decide singular/plural, then choose the verb.' },
  'sci.wall-membrane-confusion': { label: 'Confused cell wall and cell membrane', reteach: 'Compare plant and animal cells side by side.' },
  'sci.structure-function': { label: 'Mismatched cell structure and function', reteach: 'Link each structure to its job with an analogy (e.g. nucleus = control room).' },
  'sci.metal-property-confusion': { label: 'Confused properties of metals and non-metals', reteach: 'Revisit malleability, ductility, sonority and conductivity with examples.' },
  'sci.litmus-confusion': { label: 'Misread litmus results for oxides', reteach: 'Metal oxide → basic → red litmus turns blue; non-metal oxide → acidic → blue turns red.' },
  'sci.pressure-area-inverse': { label: 'Thought larger area gives larger pressure', reteach: 'Use the knife / drawing pin / camel feet examples.' },
  'sci.pressure-formula': { label: 'Used the pressure formula incorrectly', reteach: 'Write P = F ÷ A with units; practise rearranging.' },
  'sci.contact-noncontact': { label: 'Confused contact and non-contact forces', reteach: 'Ask: must the objects touch for this force to act?' },
}

export function misconceptionLabel(id: string): string {
  return MISCONCEPTIONS[id]?.label ?? id
}
