/**
 * Story scenes. Short, age-appropriate dialogue that gives each learning
 * challenge a purpose. "player" lines use the student's own avatar.
 * Story content is data — UI components never hardcode it.
 */
import type { StoryScene } from '@/core/story/types'

const scenes: StoryScene[] = [
  // -------------------------------------------------------------- world
  {
    id: 'welcome',
    objective: 'Choose a region on the map to begin.',
    lines: [
      { speaker: 'kavi', text: 'Welcome to the Adventure World! I’m Kavi, your trail guide.' },
      { speaker: 'kavi', text: 'Three regions need help: the Kingdom of Words, the Realm of Numbers and, further on, the Frontier of Discovery.' },
      {
        speaker: 'kavi',
        text: 'Each region has people with real problems. Solving them means learning something new. Ready?',
        choices: [
          { label: 'Ready!', reply: 'That’s the spirit. Pick a region on the map whenever you like.' },
          { label: 'What if I get things wrong?', reply: 'Then you learn something. You’ll get hints, explanations and fresh questions — mistakes are part of the trail.' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------- mathematics
  {
    id: 'math-m1-intro',
    objective: 'Solve 5 one-step equations (at least 2 harder ones) to count the planks.',
    hint: 'Whatever is done to x, do the opposite to both sides.',
    lines: [
      { speaker: 'ira', text: 'A storm washed away half of the Bridge of Balance! I need to know exactly how many planks we have.' },
      { speaker: 'ira', text: 'My delivery notes are written as equations. If I know x + 12 = 30, how many planks were there before the delivery?' },
      {
        speaker: 'ira',
        text: 'Think of an equation as a balance. Keep both sides level and get x on its own.',
        choices: [
          { label: 'Subtract 12 from both sides?', reply: 'Exactly! 30 − 12 = 18 planks. Let’s count the rest together.' },
          { label: 'I’m not sure yet.', reply: 'That’s fine — I’ll show you hints as we go. Let’s start with some simple ones.' },
        ],
      },
    ],
  },
  {
    id: 'math-m1-outro',
    lines: [
      { speaker: 'ira', text: 'Every plank counted! Undoing operations is the key to all equations.' },
      { speaker: 'ira', text: 'Next, the rope lift — its load needs two steps to work out.' },
    ],
  },
  {
    id: 'math-m2-intro',
    objective: 'Solve 5 equations, including at least 1 at the hardest level, to load the lift safely.',
    hint: 'Undo addition or subtraction first, then multiplication or division.',
    lines: [
      { speaker: 'ira', text: 'The rope lift carries crates down to the river. Too much weight and the rope snaps!' },
      { speaker: 'ira', text: '3 crates plus a 5 kg basket weigh 26 kg. That’s 3x + 5 = 26 — two steps to undo.' },
      { speaker: 'player', text: 'So I remove the 5 first, then divide by 3?' },
      { speaker: 'ira', text: 'Reverse order — like taking off your shoes before your socks. Let’s load the lift.' },
    ],
  },
  {
    id: 'math-m2-outro',
    lines: [{ speaker: 'ira', text: 'The lift is running smoothly. But look — someone is guarding the river crossing.' }],
  },
  {
    id: 'math-mini-intro',
    objective: 'Answer at least 4 of 5 toll riddles, with at least one correct for each kind of equation.',
    lines: [
      { speaker: 'gorm', text: 'HALT! Nobody crosses my river without paying the toll.' },
      { speaker: 'player', text: 'I don’t have any coins…' },
      { speaker: 'gorm', text: 'Coins? Bah! My toll is paid in solved equations. One-step AND two-step. Five stones. Let’s see what you’ve learned.' },
    ],
  },
  {
    id: 'math-mini-outro',
    lines: [{ speaker: 'gorm', text: 'Hmph. You actually understand them. Fine — cross, and good luck with the scales.' }],
  },
  {
    id: 'math-m3-intro',
    objective: 'Solve 4 equations with x on both sides, including at least 1 at the hardest level.',
    hint: 'Move all the x terms to one side first by subtracting.',
    lines: [
      { speaker: 'ira', text: 'The bridge has two balancing scales. When x appears on both sides, we collect them first.' },
      { speaker: 'ira', text: 'In 5x = 2x + 12, subtract 2x from both sides: 3x = 12. Then it’s a one-step equation!' },
    ],
  },
  {
    id: 'math-m3-outro',
    lines: [{ speaker: 'ira', text: 'Perfectly level. Now the hard part: the crew’s plans are all in words, not equations.' }],
  },
  {
    id: 'math-m4-intro',
    objective: 'Solve 5 story problems by forming equations, including at least 1 at the hardest level.',
    hint: 'Name the unknown as x, then write every quantity using x.',
    lines: [
      { speaker: 'ira', text: 'My crew talks in stories: “The length is 4 m more than the width…”. You’ll turn them into equations.' },
      { speaker: 'ira', text: 'First decide what x stands for. Then build the equation, solve it, and check the answer makes sense.' },
    ],
  },
  {
    id: 'math-m4-outro',
    lines: [
      { speaker: 'ira', text: 'The plan is ready! But… do you hear that thunder?' },
      { speaker: 'kavi', text: 'The Storm Golem! It’s been tearing the bridge down every time it’s rebuilt.' },
    ],
  },
  {
    id: 'math-boss-intro',
    objective: 'Get at least 4 of 6 correct, with every idea answered correctly at least once.',
    lines: [
      { speaker: 'golem', text: 'RRRUMBLE. Bridges fall. Storms remain.' },
      { speaker: 'ira', text: 'Each problem we solve strengthens the bridge against the storm. Use everything you’ve learned!' },
      { speaker: 'player', text: 'One-step, two-step, both sides, stories. I’m ready.' },
    ],
  },
  {
    id: 'math-boss-outro',
    lines: [
      { speaker: 'golem', text: '…the bridge… holds. The storm… passes.' },
      { speaker: 'ira', text: 'You did it! The Bridge of Balance stands. Try the follow-up check to see how far you’ve come.' },
    ],
  },

  // -------------------------------------------------------------- english
  {
    id: 'eng-m1-intro',
    objective: 'Fix 5 signboards (at least 2 trickier ones) using past tense and articles.',
    hint: 'Look for time words like “yesterday”, and say the next word aloud before choosing a or an.',
    lines: [
      { speaker: 'lexa', text: 'Welcome to Lexton! Our library’s magic keeps the town’s words in order — but it’s been lost.' },
      { speaker: 'lexa', text: 'Now the signboards are full of mistakes. “Yesterday, Meena goed to the market.” Can you hear what’s wrong?' },
      {
        speaker: 'lexa',
        text: 'Help me repair them. Each fixed sign brings back a little of the library’s magic.',
        choices: [
          { label: '“Goed” should be “went”!', reply: 'Exactly — “go” is irregular. Let’s fix the rest of the town.' },
          { label: 'Let’s look at them.', reply: 'Follow me. The first one is just around the corner.' },
        ],
      },
    ],
  },
  { id: 'eng-m1-outro', lines: [{ speaker: 'lexa', text: 'The signs are readable again! Now, the library’s scrolls are scrambled. Follow me.' }] },
  {
    id: 'eng-m2-intro',
    objective: 'Rebuild or correct 4 sentences from the damaged scrolls.',
    hint: 'Find the subject and the verb first, then check they agree.',
    lines: [
      { speaker: 'lexa', text: 'These scrolls fell from the top shelf. Some words are jumbled, some sentences have mistakes.' },
      { speaker: 'lexa', text: 'Start with who is doing something, then what they do. And check the verb matches its subject!' },
    ],
  },
  { id: 'eng-m2-outro', lines: [{ speaker: 'lexa', text: 'The scrolls are whole again. The reading room’s door is starting to glow…' }] },
  {
    id: 'eng-m3-intro',
    objective: 'Answer 5 reading and vocabulary questions, including at least 1 inference question.',
    hint: 'Go back to the passage — the answer is there, sometimes between the lines.',
    lines: [
      { speaker: 'lexa', text: 'The reading room! Its pages were saved from the storm, but the questions in its index were lost.' },
      { speaker: 'lexa', text: 'Read each page carefully. Some answers are written plainly; others you’ll need to work out.' },
    ],
  },
  { id: 'eng-m3-outro', lines: [{ speaker: 'lexa', text: 'Wonderful reading. There’s only one door left: the Archive, guarded by the Riddle Keeper.' }] },
  {
    id: 'eng-boss-intro',
    objective: 'Solve at least 4 of 6 riddles, with every idea answered correctly at least once.',
    lines: [
      { speaker: 'owl', text: 'Hoo… who wishes to enter the Archive?' },
      { speaker: 'player', text: 'I’m here to bring back the library’s magic.' },
      { speaker: 'owl', text: 'Then answer my riddles: tense, articles, sentences, words and reading. All of them.' },
    ],
  },
  {
    id: 'eng-boss-outro',
    lines: [
      { speaker: 'owl', text: 'Hoo! The Archive opens to a true reader.' },
      { speaker: 'lexa', text: 'The library’s magic is back! Try the follow-up check to see your progress.' },
    ],
  },

  // -------------------------------------------------------------- science
  {
    id: 'sci-m1-intro',
    objective: 'Answer 5 cell questions (at least 2 trickier ones) to complete the specimen notes.',
    hint: 'Start from the outside of the cell and work inwards.',
    lines: [
      { speaker: 'nova', text: 'Welcome to Field Station Alpha! I study living things, materials and forces out here.' },
      { speaker: 'nova', text: 'Today: cells. Every living thing is made of them. Let’s look at a leaf cell under the microscope.' },
      {
        speaker: 'nova',
        text: 'Plant cells have a few parts animal cells don’t. Any guesses?',
        choices: [
          { label: 'A cell wall?', reply: 'Yes! And chloroplasts, which make food. Let’s label what we see.' },
          { label: 'I’m not sure.', reply: 'You’ll spot them soon. Let’s start labelling.' },
        ],
      },
    ],
  },
  { id: 'sci-m1-outro', lines: [{ speaker: 'nova', text: 'Excellent specimen notes. The station is making progress!' }] },
  {
    id: 'sci-m2-intro',
    objective: 'Answer 5 questions on metals and non-metals (at least 2 trickier ones).',
    hint: 'Metals: shiny, malleable, ductile, sonorous, good conductors. Their oxides are basic.',
    lines: [
      { speaker: 'nova', text: 'The storm mixed up my sample jars! We need to sort metals from non-metals.' },
      { speaker: 'nova', text: 'You can try the safe litmus simulator first to see how oxide solutions behave.' },
    ],
  },
  { id: 'sci-m2-outro', lines: [{ speaker: 'nova', text: 'Every jar is labelled correctly. Great chemistry!' }] },
  {
    id: 'sci-m3-intro',
    objective: 'Answer 5 questions on force and pressure (at least 2 trickier ones).',
    hint: 'Pressure = force ÷ area. Same force, smaller area → more pressure.',
    lines: [
      { speaker: 'nova', text: 'Our equipment keeps sinking into the soft ground. That’s a pressure problem!' },
      { speaker: 'nova', text: 'Try the pressure simulator first: change the force and the area, and watch what happens.' },
    ],
  },
  { id: 'sci-m3-outro', lines: [{ speaker: 'nova', text: 'Nothing is sinking now. Wait… why is the sky crackling?' }] },
  {
    id: 'sci-boss-intro',
    objective: 'Get at least 4 of 6 correct, with every idea answered correctly at least once.',
    lines: [
      { speaker: 'cloud', text: 'Bzzt! I’m Static. I love scrambling labels and knocking over jars!' },
      { speaker: 'nova', text: 'Use biology, chemistry and physics together to put the station back in order!' },
    ],
  },
  {
    id: 'sci-boss-outro',
    lines: [
      { speaker: 'cloud', text: 'Fzzt… fine, you know your science.' },
      { speaker: 'nova', text: 'The station is safe! Try the follow-up check to see what you’ve learned.' },
    ],
  },
]

export const SCENES: Record<string, StoryScene> = Object.fromEntries(scenes.map((s) => [s.id, s]))
