/**
 * ILLUSTRATIVE SAMPLE CONTENT — English, "The Lost Library".
 * Grammar, vocabulary and reading practice typical of Class 8.
 * Passages are original texts written for the prototype.
 * Not yet verified against the official AP SSC Class 8 textbook.
 */
import { buildMcq, choice, defineTemplate, ILLUSTRATIVE, int, PENDING, PROTOTYPE_APPROVED } from '@/core/content/define'
import type { QuestionTemplate } from '@/core/content/types'

const CH = 'eng-library'
const base = { version: 1, grade: 8 as const, subject: 'english' as const, chapterId: CH, curriculum: ILLUSTRATIVE }

const M = {
  overreg: 'eng.overregularisation',
  tense: 'eng.tense-mismatch',
  letterRule: 'eng.vowel-letter-rule',
  definite: 'eng.definite-article',
  agreement: 'eng.subject-verb-agreement',
}

const VERBS = [
  { base: 'go', past: 'went', third: 'goes', wrong: ['goed'], obj: 'to the old library' },
  { base: 'write', past: 'wrote', third: 'writes', wrong: ['writed', 'writted'], obj: 'a letter to the museum' },
  { base: 'find', past: 'found', third: 'finds', wrong: ['finded'], obj: 'a brass key under the mat' },
  { base: 'take', past: 'took', third: 'takes', wrong: ['taked'], obj: 'the bus to Vijayawada' },
  { base: 'see', past: 'saw', third: 'sees', wrong: ['seed'], obj: 'a rainbow over the river' },
  { base: 'bring', past: 'brought', third: 'brings', wrong: ['bringed', 'brang', 'brung'], obj: 'lunch for the whole team' },
  { base: 'teach', past: 'taught', third: 'teaches', wrong: ['teached'], obj: 'us a new song' },
  { base: 'build', past: 'built', third: 'builds', wrong: ['builded'], obj: 'a model of a lighthouse' },
] as const

const SUBJECTS = ['Meena', 'the librarian', 'Arjun', 'my cousin'] as const
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const TIME = ['Yesterday', 'Last week', 'Two days ago', 'Last summer'] as const

const PLAIN_NOUNS = [
  { noun: 'apple', article: 'an' },
  { noun: 'umbrella', article: 'an' },
  { noun: 'owl', article: 'an' },
  { noun: 'egg', article: 'an' },
  { noun: 'old lantern', article: 'an' },
  { noun: 'map', article: 'a' },
  { noun: 'candle', article: 'a' },
  { noun: 'dusty book', article: 'a' },
] as const

/** Nouns where the first *sound*, not the first letter, decides a/an. */
const SOUND_NOUNS = [
  { noun: 'hour', article: 'an', why: 'The “h” in hour is silent, so it begins with a vowel sound.' },
  { noun: 'honest guard', article: 'an', why: 'The “h” in honest is silent, so it begins with a vowel sound.' },
  { noun: 'university', article: 'a', why: 'University begins with a “yoo” sound, which is a consonant sound.' },
  { noun: 'useful tool', article: 'a', why: 'Useful begins with a “yoo” sound, which is a consonant sound.' },
  { noun: 'one-rupee coin', article: 'a', why: 'One begins with a “w” sound, which is a consonant sound.' },
  { noun: 'European stamp', article: 'a', why: 'European begins with a “yoo” sound, which is a consonant sound.' },
] as const

const ORDER_SENTENCES = [
  { tokens: ['The', 'old', 'map', 'showed', 'a', 'hidden', 'door'], alts: [] },
  { tokens: ['Meena', 'carefully', 'repaired', 'the', 'torn', 'page'], alts: [['Meena', 'repaired', 'the', 'torn', 'page', 'carefully']] },
  { tokens: ['The', 'librarian', 'asked', 'us', 'to', 'speak', 'softly'], alts: [] },
  { tokens: ['Every', 'scroll', 'in', 'the', 'tower', 'was', 'covered', 'in', 'dust'], alts: [] },
  { tokens: ['Arjun', 'has', 'already', 'finished', 'his', 'story'], alts: [] },
  { tokens: ['We', 'returned', 'the', 'books', 'before', 'closing', 'time'], alts: [] },
] as const

const CORRECTIONS = [
  {
    wrong: "She don't like mangoes.",
    accepted: ["She doesn't like mangoes.", 'She does not like mangoes.'],
    why: 'With “she”, the helping verb is “does”, so the negative is “doesn’t” (does not).',
  },
  { wrong: 'The books is on the top shelf.', accepted: ['The books are on the top shelf.'], why: '“Books” is plural, so the verb must be “are”.' },
  { wrong: 'Yesterday we go to the library.', accepted: ['Yesterday we went to the library.'], why: '“Yesterday” shows a finished action, so the simple past “went” is needed.' },
  { wrong: 'He have finished his homework.', accepted: ['He has finished his homework.'], why: 'With “he”, the present perfect uses “has”.' },
  { wrong: 'There is many scrolls in the tower.', accepted: ['There are many scrolls in the tower.'], why: '“Many scrolls” is plural, so we say “there are”.' },
  {
    wrong: 'Each of the students have a library card.',
    accepted: ['Each of the students has a library card.'],
    why: '“Each” refers to one student at a time, so the verb is singular: “has”.',
  },
] as const

const WORDS = [
  { w: 'ancient', m: 'very old', ant: 'modern' },
  { w: 'fragile', m: 'easily broken', ant: 'sturdy' },
  { w: 'enormous', m: 'very large', ant: 'tiny' },
  { w: 'curious', m: 'eager to know or learn', ant: 'uninterested' },
  { w: 'scarce', m: 'hard to find; not enough', ant: 'plentiful' },
  { w: 'brave', m: 'ready to face danger', ant: 'fearful' },
  { w: 'silent', m: 'making no sound', ant: 'noisy' },
  { w: 'swift', m: 'very fast', ant: 'slow' },
] as const

export const PASSAGES = {
  lighthouse: {
    title: 'The Lighthouse Keeper’s Notebook',
    text:
      'Every evening, Leela climbed the ninety steps of the old lighthouse to light the lamp. Her grandfather had kept the light for forty years, and he had filled a notebook with notes about storms, ships and seabirds.\n\n' +
      'One stormy night the electricity failed. Leela remembered a line from the notebook: “When the power goes, the brass lamp still burns.” She found the brass lamp in a cupboard, filled it with oil and lit it. Far out at sea, a fishing boat saw the steady light and turned safely towards the harbour.',
  },
  seeds: {
    title: 'The Seed Library',
    text:
      'In a small town near Guntur, the school opened an unusual library. Instead of books, its shelves held paper packets of seeds. Students could borrow a packet of tomato, chilli or brinjal seeds, grow the plants at home, and return new seeds at the end of the season.\n\n' +
      'The librarian, Mr. Rao, kept a register of who borrowed what. In the first year, sixty students borrowed seeds, and fifty-two of them returned seeds after harvest. “A library does not have to lend only stories,” Mr. Rao said. “It can lend a future harvest too.”',
  },
} as const

type PassageId = keyof typeof PASSAGES
interface ReadingItem {
  passage: PassageId
  q: string
  correct: string
  wrong: [string, string, string]
  why: string
}

const LITERAL: ReadingItem[] = [
  {
    passage: 'lighthouse',
    q: 'Why did Leela climb the steps every evening?',
    correct: 'To light the lamp',
    wrong: ['To read the notebook', 'To watch the seabirds', 'To repair the electricity'],
    why: 'The first sentence says she climbed the steps “to light the lamp”.',
  },
  {
    passage: 'lighthouse',
    q: 'How long had her grandfather kept the light?',
    correct: 'Forty years',
    wrong: ['Ninety years', 'Nine years', 'Fourteen years'],
    why: 'The passage says he “had kept the light for forty years”. Ninety is the number of steps.',
  },
  {
    passage: 'seeds',
    q: 'What did the shelves of this library hold?',
    correct: 'Packets of seeds',
    wrong: ['Storybooks about farming', 'Vegetables for sale', 'Gardening tools'],
    why: 'The passage says “its shelves held paper packets of seeds”.',
  },
  {
    passage: 'seeds',
    q: 'How many students returned seeds after harvest in the first year?',
    correct: 'Fifty-two',
    wrong: ['Sixty', 'Eight', 'Twelve'],
    why: 'Sixty students borrowed seeds, and fifty-two of them returned seeds.',
  },
]

const INFERENCE: ReadingItem[] = [
  {
    passage: 'lighthouse',
    q: 'What helped Leela solve the problem on the stormy night?',
    correct: 'A note her grandfather had written',
    wrong: ['A message from the fishing boat', 'The electricity coming back', 'A call from the harbour'],
    why: 'She remembered a line from her grandfather’s notebook about the brass lamp.',
  },
  {
    passage: 'lighthouse',
    q: 'In the passage, a “steady” light is a light that…',
    correct: 'does not flicker or go out',
    wrong: ['moves from side to side', 'is very hot', 'changes colour'],
    why: 'A steady light shines continuously, which is why the boat could follow it.',
  },
  {
    passage: 'seeds',
    q: 'What did Mr. Rao mean by “It can lend a future harvest too”?',
    correct: 'Borrowed seeds can grow into crops later',
    wrong: ['The library will sell vegetables', 'Students must work on a farm', 'Books about harvests are popular'],
    why: 'Seeds borrowed now grow into plants, so the library is lending a harvest that comes in the future.',
  },
]

function readingTemplate(id: string, title: string, items: ReadingItem[], difficulty: 2 | 3, objective: string, transfer: boolean): QuestionTemplate {
  return defineTemplate({
    ...base,
    id,
    title,
    conceptId: 'eng.reading',
    objective,
    difficulty,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true, transfer },
    variables: { item: int(0, items.length - 1) },
    build: ({ item }, rng) => {
      const it = items[item]
      const mcq = buildMcq(rng, [{ text: it.correct, correct: true }, ...it.wrong.map((w) => ({ text: w }))])
      return {
        view: { context: 'Lexa hands you a page rescued from the archive.', passage: PASSAGES[it.passage], prompt: it.q, body: mcq.view },
        key: { body: mcq.key, answerDisplay: it.correct, explanation: it.why },
        hints: [
          'Find the sentence in the passage that talks about this.',
          difficulty === 3 ? 'The answer is not written word for word — think about what the passage suggests.' : 'Read the whole sentence, not just one word.',
        ],
      }
    },
  })
}

export const englishTemplates: QuestionTemplate[] = [
  defineTemplate({
    ...base,
    id: 'eng.past.fill-irregular',
    title: 'Simple past of irregular verbs (fill in)',
    conceptId: 'eng.past-tense',
    objective: 'Write the simple past form of common irregular verbs.',
    difficulty: 1,
    type: 'text',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { verb: choice(VERBS), subject: choice(SUBJECTS), time: choice(TIME) },
    build: ({ verb, subject, time }) => ({
      view: {
        context: 'A signboard in Lexton has a word missing.',
        prompt: `${time}, ${subject} ____ (${verb.base}) ${verb.obj}.`,
        body: { kind: 'text', mode: 'fill', placeholder: 'Type the missing word' },
      },
      key: {
        body: {
          kind: 'text',
          accepted: [verb.past],
          misconceptions: [
            { values: [...verb.wrong, `${verb.base}ed`], misconceptionId: M.overreg, feedback: `“${verb.base}” is an irregular verb, so its past form does not end in -ed.` },
            { values: [verb.base, verb.third], misconceptionId: M.tense, feedback: `“${time}” tells us the action is finished, so we need the past form.` },
          ],
        },
        answerDisplay: verb.past,
        explanation: `“${time}” shows the action happened in the past. The simple past of “${verb.base}” is “${verb.past}”: ${time}, ${subject} ${verb.past} ${verb.obj}.`,
      },
      hints: [`“${time}” tells you when this happened.`, `“${verb.base}” is irregular — its past form is a different word, not “${verb.base}ed”.`],
    }),
  }),
  defineTemplate({
    ...base,
    id: 'eng.past.choose-sentence',
    title: 'Choose the correctly tensed sentence',
    conceptId: 'eng.past-tense',
    objective: 'Recognise the simple past used with past time markers.',
    difficulty: 2,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { verb: choice(VERBS), subject: choice(SUBJECTS), time: choice(TIME) },
    build: ({ verb, subject, time }, rng) => {
      const mcq = buildMcq(rng, [
        { text: `${time}, ${subject} ${verb.past} ${verb.obj}.`, correct: true },
        {
          text: `${time}, ${subject} ${verb.third} ${verb.obj}.`,
          misconception: { misconceptionId: M.tense, feedback: `“${verb.third}” is present tense, but “${time}” is in the past.` },
        },
        {
          text: `${time}, ${subject} ${verb.wrong[0]} ${verb.obj}.`,
          misconception: { misconceptionId: M.overreg, feedback: `“${verb.wrong[0]}” is not the past form of “${verb.base}”, which is irregular.` },
        },
        {
          text: `${time}, ${subject} will ${verb.base} ${verb.obj}.`,
          misconception: { misconceptionId: M.tense, feedback: `“will ${verb.base}” is about the future, but “${time}” is in the past.` },
        },
      ])
      return {
        view: { context: 'Only one of these signboards is written correctly.', prompt: 'Which sentence is correct?', body: mcq.view },
        key: {
          body: mcq.key,
          answerDisplay: `${time}, ${subject} ${verb.past} ${verb.obj}.`,
          explanation: `A past time marker (“${time}”) needs the simple past. The past of “${verb.base}” is “${verb.past}”.`,
        },
        hints: ['Look at the time phrase at the start of each sentence.'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'eng.articles.a-an-plain',
    title: 'a or an (regular nouns)',
    conceptId: 'eng.articles',
    objective: 'Use “a” before consonant sounds and “an” before vowel sounds.',
    difficulty: 1,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    variables: { n: choice(PLAIN_NOUNS) },
    build: ({ n }, rng) => {
      const mcq = buildMcq(rng, [
        { text: 'a', correct: n.article === 'a' },
        { text: 'an', correct: n.article === 'an' },
      ])
      return {
        view: { context: 'Lexa is labelling the shelves.', prompt: `There is ____ ${n.noun} on the reading table.`, body: mcq.view },
        key: {
          body: mcq.key,
          answerDisplay: n.article,
          explanation: `“${n.noun}” begins with a ${n.article === 'an' ? 'vowel' : 'consonant'} sound, so we use “${n.article}”: ${n.article} ${n.noun}.`,
        },
        hints: ['Say the next word aloud. Does it start with a vowel sound or a consonant sound?'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'eng.articles.a-an-sound',
    title: 'a or an (sound, not spelling)',
    conceptId: 'eng.articles',
    objective: 'Choose a/an by the first sound of the next word, not its first letter.',
    difficulty: 2,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { n: choice(SOUND_NOUNS) },
    build: ({ n }, rng) => {
      const trap = { misconceptionId: M.letterRule, feedback: 'The choice depends on the first sound you hear, not the first letter you see.' }
      const mcq = buildMcq(rng, [
        { text: 'a', correct: n.article === 'a', misconception: n.article === 'an' ? trap : undefined },
        { text: 'an', correct: n.article === 'an', misconception: n.article === 'a' ? trap : undefined },
      ])
      return {
        view: { context: 'A tricky label in the archive.', prompt: `Arjun found ____ ${n.noun} in the archive.`, body: mcq.view },
        key: { body: mcq.key, answerDisplay: n.article, explanation: `${n.why} So we write “${n.article} ${n.noun}”.` },
        hints: ['Say the word aloud and listen to the very first sound.', 'Some words start with a silent letter, and some vowels sound like “y” or “w”.'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'eng.articles.the',
    title: 'Using “the” for something already mentioned',
    conceptId: 'eng.articles',
    objective: 'Use “the” when the reader already knows which thing is meant.',
    difficulty: 2,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: {
      pair: choice([
        { first: 'a cat', noun: 'cat', rest: 'was asleep on the dictionaries' },
        { first: 'an old trunk', noun: 'trunk', rest: 'was full of letters' },
        { first: 'a parrot', noun: 'parrot', rest: 'could say “Silence, please!”' },
        { first: 'a lamp', noun: 'lamp', rest: 'flickered when the door opened' },
      ] as const),
      subject: choice(SUBJECTS),
    },
    build: ({ pair, subject }, rng) => {
      const mcq = buildMcq(rng, [
        { text: 'The', correct: true },
        { text: 'A', misconception: { misconceptionId: M.definite, feedback: `We already know which ${pair.noun} — the one just mentioned — so we use “the”.` } },
        {
          text: 'An',
          misconception: { misconceptionId: M.definite, feedback: `“An” is for a vowel sound and for something not yet identified. Here the ${pair.noun} is already known.` },
        },
      ])
      return {
        view: { prompt: `${cap(subject)} saw ${pair.first} in the reading room. ____ ${pair.noun} ${pair.rest}.`, body: mcq.view },
        key: {
          body: mcq.key,
          answerDisplay: 'The',
          explanation: `The first sentence introduces ${pair.first}. In the second sentence the reader knows which ${pair.noun} we mean, so we use “the”.`,
        },
        hints: ['Has this thing already been mentioned?'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'eng.sentences.order',
    title: 'Build a sentence from word tiles',
    conceptId: 'eng.sentences',
    objective: 'Arrange words into a grammatically correct English sentence.',
    difficulty: 2,
    type: 'order',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { s: int(0, ORDER_SENTENCES.length - 1) },
    build: ({ s }, rng) => {
      const sent = ORDER_SENTENCES[s]
      const ids = sent.tokens.map((_, i) => `t${i}`)
      const shuffledIdx = rng.shuffle(sent.tokens.map((_, i) => i))
      // Avoid presenting the tiles already in the correct order.
      if (shuffledIdx.every((v, i) => v === i)) shuffledIdx.reverse()
      return {
        view: {
          context: 'The words on this scroll have been scrambled.',
          prompt: 'Tap the words in order to rebuild the sentence.',
          body: { kind: 'order', tokens: shuffledIdx.map((i) => ({ id: ids[i], text: sent.tokens[i] })) },
        },
        key: {
          body: { kind: 'order', accepted: [[...sent.tokens], ...sent.alts.map((a) => [...a])] },
          answerDisplay: `${sent.tokens.join(' ')}.`,
          explanation: `English sentences usually follow subject → verb → object. Here: “${sent.tokens.join(' ')}.”`,
        },
        hints: ['Start with the word that has a capital letter.', 'Find the action word (verb) and put the doer before it.'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'eng.sentences.correct',
    title: 'Sentence correction',
    conceptId: 'eng.sentences',
    objective: 'Correct errors of agreement and tense in a sentence.',
    difficulty: 2,
    type: 'text',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { c: int(0, CORRECTIONS.length - 1) },
    build: ({ c }) => {
      const item = CORRECTIONS[c]
      return {
        view: {
          context: 'A scroll has a mistake in it.',
          prompt: `Rewrite the sentence correctly:  “${item.wrong}”`,
          body: { kind: 'text', mode: 'correction', placeholder: 'Type the corrected sentence' },
        },
        key: {
          body: {
            kind: 'text',
            accepted: [...item.accepted],
            misconceptions: [{ values: [item.wrong], misconceptionId: M.agreement, feedback: 'The sentence is unchanged — look for the word that does not agree.' }],
          },
          answerDisplay: item.accepted[0],
          explanation: item.why,
        },
        hints: ['Find the subject. Is it singular or plural?', 'Check that the verb matches the subject and the time.'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'eng.sentences.signboard-multi',
    title: 'Multi-step: repair a signboard (tense + article)',
    conceptId: 'eng.sentences',
    objective: 'Apply past tense and article rules together in one sentence.',
    difficulty: 3,
    type: 'multi',
    review: PROTOTYPE_APPROVED,
    variables: { verb: choice(VERBS.slice(2, 6)), subject: choice(SUBJECTS), time: choice(TIME), n: choice([...SOUND_NOUNS, ...PLAIN_NOUNS.slice(3, 6)]) },
    build: ({ verb, subject, time, n }, rng) => {
      const art = buildMcq(
        rng,
        [
          { text: 'a', correct: n.article === 'a' },
          { text: 'an', correct: n.article === 'an' },
        ],
        'Step 2: Which article fills blank (2)?',
      )
      return {
        view: {
          context: 'The final signboard has two missing words.',
          prompt: `${time}, ${subject} __(1)__ (${verb.base}) __(2)__ ${n.noun}.`,
          body: {
            kind: 'multi',
            parts: [{ kind: 'text', mode: 'fill', prompt: `Step 1: Write the correct form of “${verb.base}” for blank (1).`, placeholder: 'verb' }, art.view],
          },
        },
        key: {
          body: {
            kind: 'multi',
            parts: [
              {
                kind: 'text',
                accepted: [verb.past],
                misconceptions: [
                  { values: [...verb.wrong, `${verb.base}ed`], misconceptionId: M.overreg, feedback: `“${verb.base}” is irregular.` },
                  { values: [verb.base, verb.third], misconceptionId: M.tense, feedback: `“${time}” needs the past tense.` },
                ],
              },
              art.key,
            ],
          },
          answerDisplay: `${time}, ${subject} ${verb.past} ${n.article} ${n.noun}.`,
          explanation: `Past time marker → simple past “${verb.past}”. “${n.noun}” starts with a ${n.article === 'an' ? 'vowel' : 'consonant'} sound → “${n.article}”.`,
        },
        hints: ['Blank (1): look at the time phrase.', 'Blank (2): say the next word aloud.'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'eng.vocab.match',
    title: 'Match words to meanings',
    conceptId: 'eng.vocab',
    objective: 'Match descriptive words with their meanings.',
    difficulty: 1,
    type: 'match',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { start: int(0, WORDS.length - 1) },
    build: ({ start }, rng) => {
      const picked = [0, 1, 2, 3].map((i) => WORDS[(start + i) % WORDS.length])
      const rightIds = rng.shuffle(['r1', 'r2', 'r3', 'r4'])
      const left = picked.map((p, i) => ({ id: `l${i}`, text: p.w }))
      const right = picked.map((p, i) => ({ id: rightIds[i], text: p.m }))
      const pairs: Record<string, string> = {}
      picked.forEach((_, i) => (pairs[`l${i}`] = rightIds[i]))
      return {
        view: {
          context: 'The archive’s word cards have fallen on the floor.',
          prompt: 'Match each word with its meaning.',
          body: { kind: 'match', left: rng.shuffle(left), right: rng.shuffle(right) },
        },
        key: { body: { kind: 'match', pairs }, answerDisplay: picked.map((p) => `${p.w} → ${p.m}`).join('; '), explanation: picked.map((p) => `“${p.w}” means ${p.m}.`).join(' ') },
        hints: ['Start with the word you are most sure about.', 'Try each meaning in a sentence with the word.'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'eng.vocab.syn-ant',
    title: 'Synonyms and antonyms',
    conceptId: 'eng.vocab',
    objective: 'Identify words with similar or opposite meanings.',
    difficulty: 2,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { i: int(0, WORDS.length - 1), mode: choice(['similar', 'opposite'] as const) },
    build: ({ i, mode }, rng) => {
      const word = WORDS[i]
      const others = rng.sample(
        WORDS.filter((_, j) => j !== i),
        3,
      )
      const correct = mode === 'similar' ? word.m : word.ant
      const mcq = buildMcq(rng, [{ text: correct, correct: true }, ...others.map((o) => ({ text: mode === 'similar' ? o.m : o.ant }))])
      return {
        view: { prompt: `Which ${mode === 'similar' ? 'meaning is closest to' : 'word is opposite in meaning to'} “${word.w}”?`, body: mcq.view },
        key: { body: mcq.key, answerDisplay: correct, explanation: `“${word.w}” means ${word.m}. Its opposite is “${word.ant}”.` },
        hints: [`Use “${word.w}” in a sentence, e.g. “The ${word.w} …”.`],
      }
    },
  }),
  readingTemplate('eng.reading.literal', 'Reading comprehension: find the detail', LITERAL, 2, 'Locate stated details in a short passage.', false),
  readingTemplate('eng.reading.inference', 'Reading comprehension: infer meaning', INFERENCE, 3, 'Infer meaning and word sense from context.', true),
  defineTemplate({
    ...base,
    id: 'eng.vocab.idioms',
    title: 'Common idioms',
    conceptId: 'eng.vocab',
    objective: 'Understand the meaning of common idioms.',
    difficulty: 3,
    type: 'mcq',
    review: PENDING,
    variables: { i: int(0, 1) },
    build: ({ i }, rng) => {
      const items = [
        { idiom: 'a piece of cake', m: 'very easy', w: ['very tasty', 'a small reward'] },
        { idiom: 'break the ice', m: 'start a friendly conversation', w: ['damage something cold', 'end a friendship'] },
      ][i]
      const mcq = buildMcq(rng, [{ text: items.m, correct: true }, ...items.w.map((t) => ({ text: t }))])
      return {
        view: { prompt: `What does “${items.idiom}” mean?`, body: mcq.view },
        key: { body: mcq.key, answerDisplay: items.m, explanation: `“${items.idiom}” means ${items.m}.` },
        hints: ['Idioms do not mean exactly what their words say.'],
      }
    },
  }),
]
