/**
 * ILLUSTRATIVE SAMPLE CONTENT — Science, "Field Station Alpha".
 * Biology: cell structure and function. Chemistry: metals and non-metals.
 * Physics: force and pressure. Typical Class 8 topics.
 * Not yet verified against the official AP SSC Class 8 textbook.
 */
import { buildMcq, choice, defineTemplate, ILLUSTRATIVE, int, PENDING, PROTOTYPE_APPROVED } from '@/core/content/define'
import type { LabTestView, QuestionTemplate } from '@/core/content/types'

const CH = 'sci-field'
const base = { version: 1, grade: 8 as const, subject: 'science' as const, chapterId: CH, curriculum: ILLUSTRATIVE }

const M = {
  wallMembrane: 'sci.wall-membrane-confusion',
  structureFunction: 'sci.structure-function',
  metalProperty: 'sci.metal-property-confusion',
  litmus: 'sci.litmus-confusion',
  areaInverse: 'sci.pressure-area-inverse',
  formula: 'sci.pressure-formula',
  contact: 'sci.contact-noncontact',
}

/** Structure positions drawn on the plant-cell diagram (see components/diagrams). */
export const PLANT_CELL_PARTS = [
  { position: 'cell-wall', name: 'Cell wall' },
  { position: 'cell-membrane', name: 'Cell membrane' },
  { position: 'nucleus', name: 'Nucleus' },
  { position: 'chloroplast', name: 'Chloroplast' },
  { position: 'vacuole', name: 'Vacuole' },
  { position: 'cytoplasm', name: 'Cytoplasm' },
] as const

const FUNCTIONS = [
  { part: 'Nucleus', fn: 'Controls the activities of the cell' },
  { part: 'Cell membrane', fn: 'Controls what enters and leaves the cell' },
  { part: 'Chloroplast', fn: 'Makes food using sunlight' },
  { part: 'Cell wall', fn: 'Gives a plant cell shape and protection' },
  { part: 'Vacuole', fn: 'Stores water and dissolved substances' },
  { part: 'Cytoplasm', fn: 'Jelly-like material where many cell activities happen' },
] as const

const ELEMENTS = [
  { name: 'Iron', symbol: 'Fe', metal: true, form: 'solid' },
  { name: 'Copper', symbol: 'Cu', metal: true, form: 'solid' },
  { name: 'Sulphur', symbol: 'S', metal: false, form: 'powder' },
  { name: 'Carbon', symbol: 'C', metal: false, form: 'solid' },
  { name: 'Aluminium', symbol: 'Al', metal: true, form: 'solid' },
  { name: 'Oxygen', symbol: 'O', metal: false, form: 'gas' },
  { name: 'Zinc', symbol: 'Zn', metal: true, form: 'solid' },
  { name: 'Phosphorus', symbol: 'P', metal: false, form: 'powder' },
  { name: 'Magnesium', symbol: 'Mg', metal: true, form: 'solid' },
  { name: 'Sodium', symbol: 'Na', metal: true, form: 'soft' },
] as const

/** What the testing bench shows for each element (evidence, not the answer label). */
function elementTests(e: (typeof ELEMENTS)[number]): LabTestView[] {
  if (e.form === 'gas')
    return [
      { tool: 'hammer', effect: 'none', note: 'It is a gas in a jar — there is nothing solid to hammer!' },
      { tool: 'tester', effect: 'dark', note: 'The bulb stays off.' },
      { tool: 'polish', effect: 'none', note: 'You cannot polish a gas.' },
    ]
  if (!e.metal)
    return [
      { tool: 'hammer', effect: 'shatter', note: 'It crumbles into powder instead of bending.' },
      { tool: 'tester', effect: 'dark', note: 'The bulb stays off.' },
      { tool: 'polish', effect: 'dull', note: 'It stays dull — no shine at all.' },
    ]
  return [
    e.form === 'soft'
      ? { tool: 'hammer', effect: 'squash', note: 'It is so soft it squashes flat — it can even be cut with a knife.' }
      : { tool: 'hammer', effect: 'flatten', note: 'It flattens into a thin sheet without breaking.' },
    { tool: 'tester', effect: 'glow', note: 'The bulb glows brightly.' },
    { tool: 'polish', effect: 'shine', note: e.form === 'soft' ? 'A freshly cut surface is bright and shiny.' : 'Rubbing it shows a bright, shiny surface.' },
  ]
}

const PROPERTY_OBSERVATIONS = [
  {
    obs: 'flattens into a thin sheet when hammered',
    metal: true,
    property: 'malleable — it can be beaten into sheets',
    test: { tool: 'hammer', effect: 'flatten', note: 'It flattens into a thin sheet without breaking.' },
  },
  {
    obs: 'breaks into powder when hammered',
    metal: false,
    property: 'brittle — it breaks instead of bending',
    test: { tool: 'hammer', effect: 'shatter', note: 'It crumbles into powder instead of bending.' },
  },
  {
    obs: 'can be drawn into a thin wire',
    metal: true,
    property: 'ductile — it can be drawn into wires',
    test: { tool: 'wire', effect: 'wire', note: 'It stretches out into a long, thin wire.' },
  },
  {
    obs: 'makes a ringing sound when struck',
    metal: true,
    property: 'sonorous — it rings when struck',
    test: { tool: 'strike', effect: 'ring', note: 'Clang! It rings like a bell.' },
  },
  {
    obs: 'does not let the circuit-tester bulb glow',
    metal: false,
    property: 'a poor conductor of electricity',
    test: { tool: 'tester', effect: 'dark', note: 'The bulb stays off.' },
  },
  {
    obs: 'makes the circuit-tester bulb glow',
    metal: true,
    property: 'a good conductor of electricity',
    test: { tool: 'tester', effect: 'glow', note: 'The bulb glows brightly.' },
  },
] as const satisfies readonly { obs: string; metal: boolean; property: string; test: LabTestView }[]

const OXIDES = [
  {
    element: 'magnesium',
    metal: true,
    oxide: 'magnesium oxide',
    product: 'ash',
    flame: '#f8fafc',
    burnNote: 'It burns with a dazzling white flame and leaves a white powder: magnesium oxide.',
  },
  {
    element: 'calcium',
    metal: true,
    oxide: 'calcium oxide',
    product: 'ash',
    flame: '#f97316',
    burnNote: 'It burns with an orange-red flame and leaves white calcium oxide.',
  },
  {
    element: 'sulphur',
    metal: false,
    oxide: 'sulphur dioxide',
    product: 'gas',
    flame: '#3b82f6',
    burnNote: 'It burns with a blue flame and gives off a choking gas, sulphur dioxide, which is collected in a jar.',
  },
  {
    element: 'carbon',
    metal: false,
    oxide: 'carbon dioxide',
    product: 'gas',
    flame: '#fb923c',
    burnNote: 'It glows orange and gives off an invisible gas, carbon dioxide, which is collected in a jar.',
  },
] as const

const oxideLab = (o: (typeof OXIDES)[number]) => ({
  kind: 'oxide' as const,
  element: o.element,
  oxide: o.oxide,
  product: o.product,
  flame: o.flame,
  burnNote: o.burnNote,
  litmus: o.metal ? ('red' as const) : ('blue' as const),
  litmusAfter: o.metal ? ('blue' as const) : ('red' as const),
})

const PRESSURE_EXAMPLES = [
  {
    q: 'Why does a knife with a sharp edge cut vegetables more easily than a blunt one?',
    correct: 'The sharp edge has a smaller area, so the same force gives more pressure',
    wrong: 'The sharp edge has a larger area, so the same force gives more pressure',
  },
  {
    q: 'Why do school bags have wide shoulder straps?',
    correct: 'Wide straps spread the weight over a larger area, so there is less pressure on the shoulders',
    wrong: 'Wide straps make the bag lighter',
  },
  {
    q: 'Why is it easy to push a drawing pin into a board by its pointed end?',
    correct: 'The point has a tiny area, so a small force gives a large pressure',
    wrong: 'The point has a large area, so the force is spread out',
  },
  {
    q: 'Why do camels walk easily on sand without sinking much?',
    correct: 'Their broad feet spread their weight over a large area, reducing pressure',
    wrong: 'Their broad feet increase the pressure on the sand',
  },
] as const

const FORCE_SITUATIONS = [
  {
    s: 'A magnet pulls an iron nail towards it',
    contact: false,
    type: 'Magnetic force',
    actor: { icon: '🧲', name: 'magnet' },
    target: { icon: '🔩', name: 'iron nail' },
    reaction: 'The nail jumped towards the magnet before they touched!',
  },
  {
    s: 'A mango falls from a tree to the ground',
    contact: false,
    type: 'Gravitational force',
    actor: { icon: '🥭', name: 'mango' },
    target: { icon: '🌍', name: 'ground' },
    reaction: 'The mango was pulled down towards the ground while nothing was touching it.',
  },
  {
    s: 'A player kicks a football',
    contact: true,
    type: 'Muscular force',
    actor: { icon: '🦶', name: 'foot' },
    target: { icon: '⚽', name: 'football' },
    reaction: 'The ball only moved once the foot touched it.',
  },
  {
    s: 'A rolling ball slowly stops on grass',
    contact: true,
    type: 'Frictional force',
    actor: { icon: '⚽', name: 'rolling ball' },
    target: { icon: '🌱', name: 'grass' },
    reaction: 'The ball only slowed down where it rubbed against the grass.',
  },
  {
    s: 'A rubbed balloon attracts small bits of paper',
    contact: false,
    type: 'Electrostatic force',
    actor: { icon: '🎈', name: 'rubbed balloon' },
    target: { icon: '📄', name: 'bits of paper' },
    reaction: 'The paper bits jumped up before the balloon touched them!',
  },
  {
    s: 'You push a heavy door open',
    contact: true,
    type: 'Muscular force',
    actor: { icon: '✋', name: 'hand' },
    target: { icon: '🚪', name: 'door' },
    reaction: 'The door only moved once the hand pushed on it.',
  },
] as const

const FORCE_TYPES = [
  { s: 'A magnet pulls an iron nail', type: 'Magnetic force' },
  { s: 'A mango falls from a tree', type: 'Gravitational force' },
  { s: 'Brakes slow down a bicycle', type: 'Frictional force' },
  { s: 'A girl lifts a bucket of water', type: 'Muscular force' },
  { s: 'A rubbed comb attracts bits of paper', type: 'Electrostatic force' },
] as const

export const scienceTemplates: QuestionTemplate[] = [
  // ---------------------------------------------------------------- biology
  defineTemplate({
    ...base,
    id: 'sci.bio.label-plant-cell',
    title: 'Label the plant cell diagram',
    conceptId: 'sci.bio.cell',
    objective: 'Identify the main structures of a plant cell on a diagram.',
    difficulty: 1,
    type: 'label',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { skip: int(0, 2) },
    build: ({ skip }, rng) => {
      // Ask about four of the six structures; numbering is shuffled each time.
      const asked = PLANT_CELL_PARTS.filter((_, i) => i !== skip && i !== skip + 3)
      const numbers = rng.shuffle([1, 2, 3, 4])
      const optionIds = rng.shuffle(['o1', 'o2', 'o3', 'o4', 'o5', 'o6'])
      const options = PLANT_CELL_PARTS.map((p, i) => ({ id: optionIds[i], text: p.name }))
      const markers = asked.map((p, i) => ({ id: `m${i}`, number: numbers[i], position: p.position }))
      const pairs: Record<string, string> = {}
      asked.forEach((p, i) => (pairs[`m${i}`] = options.find((o) => o.text === p.name)!.id))
      const sorted = [...markers].sort((a, b) => a.number - b.number)
      return {
        view: {
          context: 'Dr. Nova’s microscope shows a cell from a leaf.',
          prompt: 'Choose the correct name for each numbered part.',
          body: { kind: 'label', diagram: 'plant-cell', markers: sorted, options: rng.shuffle(options) },
        },
        key: {
          body: { kind: 'label', pairs },
          answerDisplay: sorted.map((m) => `${m.number}: ${asked[Number(m.id.slice(1))].name}`).join(', '),
          explanation:
            'The cell wall is the firm outer layer; the cell membrane lies just inside it. The nucleus is the large round body that controls the cell, chloroplasts are the green bodies, the vacuole is the large central space, and cytoplasm fills the rest.',
        },
        hints: ['The cell wall is the outermost layer; the membrane is just inside it.', 'Chloroplasts are the small green bodies; the vacuole is the big central space.'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'sci.bio.plant-only',
    title: 'Structures found only in plant cells',
    conceptId: 'sci.bio.cell',
    objective: 'Distinguish plant cell structures from those shared with animal cells.',
    difficulty: 1,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    variables: { which: choice(['Cell wall', 'Chloroplast'] as const) },
    build: ({ which }, rng) => {
      const mcq = buildMcq(rng, [
        { text: which, correct: true },
        {
          text: 'Cell membrane',
          misconception: { misconceptionId: M.wallMembrane, feedback: 'Both plant and animal cells have a cell membrane. Only plant cells also have a cell wall outside it.' },
        },
        { text: 'Nucleus', misconception: { misconceptionId: M.structureFunction, feedback: 'Both plant and animal cells have a nucleus.' } },
        { text: 'Cytoplasm', misconception: { misconceptionId: M.structureFunction, feedback: 'Both plant and animal cells contain cytoplasm.' } },
      ])
      return {
        view: { context: 'Dr. Nova compares a leaf cell with a cheek cell.', prompt: 'Which of these is found in a plant cell but NOT in an animal cell?', body: mcq.view },
        key: {
          body: mcq.key,
          answerDisplay: which,
          explanation: `Plant cells have a cell wall and chloroplasts, which animal cells do not have. Both kinds of cell have a nucleus, cytoplasm and a cell membrane.`,
        },
        hints: ['Think about what a plant needs that an animal does not: making its own food and staying rigid.'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'sci.bio.function-match',
    title: 'Match cell structures with their functions',
    conceptId: 'sci.bio.cell',
    objective: 'Match cell structures with their functions.',
    difficulty: 2,
    type: 'match',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { start: int(0, FUNCTIONS.length - 1) },
    build: ({ start }, rng) => {
      const picked = [0, 1, 2, 3].map((i) => FUNCTIONS[(start + i) % FUNCTIONS.length])
      const rightIds = rng.shuffle(['r1', 'r2', 'r3', 'r4'])
      const pairs: Record<string, string> = {}
      picked.forEach((_, i) => (pairs[`l${i}`] = rightIds[i]))
      return {
        view: {
          context: 'Help Dr. Nova finish the field notes.',
          prompt: 'Match each cell structure with what it does.',
          body: {
            kind: 'match',
            left: rng.shuffle(picked.map((p, i) => ({ id: `l${i}`, text: p.part }))),
            right: rng.shuffle(picked.map((p, i) => ({ id: rightIds[i], text: p.fn }))),
          },
        },
        key: {
          body: { kind: 'match', pairs },
          answerDisplay: picked.map((p) => `${p.part} → ${p.fn}`).join('; '),
          explanation: picked.map((p) => `${p.part}: ${p.fn.toLowerCase()}.`).join(' '),
        },
        hints: ['The nucleus is often called the control centre.', 'Think about where food is made in a leaf.'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'sci.bio.observation',
    title: 'Interpret a microscope observation',
    conceptId: 'sci.bio.cell',
    objective: 'Use observations to reason about the role of cell structures.',
    difficulty: 3,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    variables: {
      item: choice([
        {
          obs: 'Under the microscope, a leaf cell shows many small green bodies.',
          q: 'What is the main job of these green bodies?',
          correct: 'Making food using sunlight',
          wrong: ['Controlling what enters the cell', 'Storing the cell’s instructions', 'Giving the cell a fixed shape'],
          why: 'Green bodies in leaf cells are chloroplasts. They contain chlorophyll and make food by photosynthesis.',
        },
        {
          obs: 'An onion peel cell keeps its rectangular shape even when the slide is pressed gently.',
          q: 'Which structure most likely helps it keep its shape?',
          correct: 'Cell wall',
          wrong: ['Nucleus', 'Cytoplasm', 'Chloroplast'],
          why: 'The firm cell wall outside the membrane gives plant cells a fixed shape and protection.',
        },
        {
          obs: 'A stain makes one large round body in each cheek cell clearly visible.',
          q: 'Which structure is this most likely to be?',
          correct: 'Nucleus',
          wrong: ['Cell wall', 'Chloroplast', 'Vacuole'],
          why: 'The nucleus takes up stain strongly. Cheek cells are animal cells, so they have no cell wall or chloroplasts.',
        },
      ] as const),
    },
    build: ({ item }, rng) => {
      const mcq = buildMcq(rng, [
        { text: item.correct, correct: true },
        ...item.wrong.map((w) => ({ text: w, misconception: { misconceptionId: M.structureFunction, feedback: 'Link each structure to what it looks like and what it does.' } })),
      ])
      return {
        view: { context: item.obs, prompt: item.q, body: mcq.view },
        key: { body: mcq.key, answerDisplay: item.correct, explanation: item.why },
        hints: ['First name the structure from the description, then recall what it does.'],
      }
    },
  }),

  // ---------------------------------------------------------------- chemistry
  defineTemplate({
    ...base,
    id: 'sci.chem.classify',
    title: 'Metal or non-metal?',
    conceptId: 'sci.chem.metals',
    objective: 'Classify common elements as metals or non-metals.',
    difficulty: 1,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    variables: { e: choice(ELEMENTS) },
    build: ({ e }, rng) => {
      const wrong = {
        misconceptionId: M.metalProperty,
        feedback: e.metal
          ? `${e.name} is shiny, conducts electricity and can be shaped — properties of a metal.`
          : `${e.name} is not shiny and does not conduct electricity well — properties of a non-metal.`,
      }
      const mcq = buildMcq(rng, [
        { text: 'Metal', correct: e.metal, misconception: e.metal ? undefined : wrong },
        { text: 'Non-metal', correct: !e.metal, misconception: e.metal ? wrong : undefined },
      ])
      return {
        view: {
          context: 'Sort the sample jars on the field station shelf.',
          prompt: `Test the ${e.name} (${e.symbol}) sample, then put it on the right shelf: metal or non-metal?`,
          body: mcq.view,
          lab: { kind: 'sample-test', sample: { name: e.name, symbol: e.symbol, form: e.form }, tests: elementTests(e) },
        },
        key: { body: mcq.key, answerDisplay: e.metal ? 'Metal' : 'Non-metal', explanation: `${e.name} (${e.symbol}) is a ${e.metal ? 'metal' : 'non-metal'}.` },
        hints: ['Think about whether it is shiny and conducts electricity.'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'sci.chem.symbols',
    title: 'Match elements with symbols',
    conceptId: 'sci.chem.metals',
    objective: 'Recall the chemical symbols of common elements.',
    difficulty: 1,
    type: 'match',
    review: PROTOTYPE_APPROVED,
    variables: { start: int(0, ELEMENTS.length - 1) },
    build: ({ start }, rng) => {
      const picked = [0, 1, 2, 3].map((i) => ELEMENTS[(start + i) % ELEMENTS.length])
      const rightIds = rng.shuffle(['r1', 'r2', 'r3', 'r4'])
      const pairs: Record<string, string> = {}
      picked.forEach((_, i) => (pairs[`l${i}`] = rightIds[i]))
      return {
        view: {
          context: 'The jar labels have come loose.',
          prompt: 'Match each element with its symbol.',
          body: {
            kind: 'match',
            left: rng.shuffle(picked.map((p, i) => ({ id: `l${i}`, text: p.name }))),
            right: rng.shuffle(picked.map((p, i) => ({ id: rightIds[i], text: p.symbol }))),
          },
        },
        key: {
          body: { kind: 'match', pairs },
          answerDisplay: picked.map((p) => `${p.name} → ${p.symbol}`).join('; '),
          explanation: 'Some symbols come from Latin names: Fe (ferrum) for iron, Cu (cuprum) for copper and Na (natrium) for sodium.',
        },
        hints: ['Most symbols start with the first letter of the element’s name.', 'Iron, copper and sodium have symbols from their Latin names.'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'sci.chem.property',
    title: 'Identify a sample from its properties',
    conceptId: 'sci.chem.metals',
    objective: 'Use physical properties to decide whether a sample is a metal or non-metal.',
    difficulty: 2,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { p: choice(PROPERTY_OBSERVATIONS) },
    build: ({ p }, rng) => {
      const wrong = { misconceptionId: M.metalProperty, feedback: `A sample that ${p.obs} is ${p.property}.` }
      const mcq = buildMcq(rng, [
        { text: 'Most likely a metal', correct: p.metal, misconception: p.metal ? undefined : wrong },
        { text: 'Most likely a non-metal', correct: !p.metal, misconception: p.metal ? wrong : undefined },
      ])
      return {
        view: {
          context: 'An unknown solid sample has turned up at the field station.',
          prompt: 'Run the test on the bench, then decide: which shelf does the sample belong on?',
          body: mcq.view,
          lab: { kind: 'sample-test', sample: { name: 'Unknown sample', form: p.metal ? 'solid' : 'powder' }, tests: [p.test] },
        },
        key: {
          body: mcq.key,
          answerDisplay: p.metal ? 'Most likely a metal' : 'Most likely a non-metal',
          explanation: `This shows the sample is ${p.property}, which is typical of ${p.metal ? 'metals' : 'non-metals'}.`,
        },
        hints: ['Metals are usually malleable, ductile, sonorous and good conductors.'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'sci.chem.oxide-litmus',
    title: 'Litmus test on an oxide solution',
    conceptId: 'sci.chem.metals',
    objective: 'Interpret litmus observations for metal and non-metal oxides.',
    difficulty: 2,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { o: choice(OXIDES) },
    build: ({ o }, rng) => {
      const litmus = o.metal ? 'red' : 'blue'
      const correct = o.metal ? 'The red litmus turns blue' : 'The blue litmus turns red'
      const mcq = buildMcq(rng, [
        { text: correct, correct: true },
        {
          text: o.metal ? 'The red litmus stays red' : 'The blue litmus stays blue',
          misconception: { misconceptionId: M.litmus, feedback: `${o.oxide} dissolves to form a${o.metal ? ' basic' : 'n acidic'} solution, which changes the colour.` },
        },
        { text: o.metal ? 'The red litmus turns green' : 'The blue litmus turns green', misconception: { misconceptionId: M.litmus, feedback: 'Litmus only shows red or blue.' } },
      ])
      return {
        view: {
          context: `Dr. Nova hands you a small piece of ${o.element}. Burn it safely, then dissolve the oxide in water.`,
          prompt: `Next, a strip of ${litmus} litmus paper goes into the solution. What do you predict?`,
          body: mcq.view,
          lab: oxideLab(o),
        },
        key: {
          body: mcq.key,
          answerDisplay: correct,
          explanation: `Oxides of metals form basic solutions (red litmus → blue). Oxides of non-metals form acidic solutions (blue litmus → red). ${o.oxide} comes from a ${o.metal ? 'metal' : 'non-metal'}.`,
        },
        hints: [`Is ${o.element} a metal or a non-metal?`, 'Metal oxides are basic; non-metal oxides are acidic.'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'sci.chem.oxide-multi',
    title: 'Multi-step: classify an oxide and predict litmus',
    conceptId: 'sci.chem.metals',
    objective: 'Link element type, oxide nature and litmus observation (multi-step).',
    difficulty: 3,
    type: 'multi',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true, transfer: true },
    variables: { o: choice(OXIDES) },
    build: ({ o }, rng) => {
      const nature = buildMcq(
        rng,
        [
          { text: 'Basic', correct: o.metal, misconception: o.metal ? undefined : { misconceptionId: M.litmus, feedback: 'Non-metal oxides are acidic.' } },
          { text: 'Acidic', correct: !o.metal, misconception: o.metal ? { misconceptionId: M.litmus, feedback: 'Metal oxides are basic.' } : undefined },
        ],
        `Step 1: Is a solution of ${o.oxide} acidic or basic?`,
      )
      const effect = buildMcq(
        rng,
        [
          { text: 'Blue litmus turns red', correct: !o.metal },
          { text: 'Red litmus turns blue', correct: o.metal },
          { text: 'Neither litmus changes', misconception: { misconceptionId: M.litmus, feedback: 'Acidic and basic solutions both change one colour of litmus.' } },
        ],
        'Step 2: What will the litmus test show?',
      )
      return {
        view: {
          context: 'A sample bottle labelled with only an element name is found after the storm.',
          prompt: `The label says “${o.element}”. Burn it, dissolve the oxide in water, then predict what you will find.`,
          body: { kind: 'multi', parts: [nature.view, effect.view] },
          lab: oxideLab(o),
        },
        key: {
          body: { kind: 'multi', parts: [nature.key, effect.key] },
          answerDisplay: `${o.metal ? 'Basic' : 'Acidic'}; ${o.metal ? 'red litmus turns blue' : 'blue litmus turns red'}`,
          explanation: `${o.element} is a ${o.metal ? 'metal' : 'non-metal'}, so ${o.oxide} forms a${o.metal ? ' basic' : 'n acidic'} solution: ${o.metal ? 'red litmus turns blue' : 'blue litmus turns red'}.`,
        },
        hints: [`Start by deciding whether ${o.element} is a metal.`],
      }
    },
  }),

  // ---------------------------------------------------------------- physics
  defineTemplate({
    ...base,
    id: 'sci.phy.pressure-calc',
    title: 'Calculate pressure (P = F ÷ A)',
    conceptId: 'sci.phy.pressure',
    objective: 'Calculate pressure from force and area.',
    difficulty: 2,
    type: 'numeric',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: {
      f: int(50, 600, { step: 10 }),
      a: choice([0.5, 1, 2, 4, 5] as const),
      obj: choice(['box of equipment', 'water tank', 'stack of books', 'crate of rock samples'] as const),
    },
    constraint: ({ f, a }) => (Number.isInteger(f / a) ? null : 'pressure should be a whole number'),
    build: ({ f, a, obj }) => {
      const p = f / a
      return {
        view: {
          context: `A ${obj} rests on the floor of the field station.`,
          prompt: 'Measure its force and the area of its base, then set the pressure gauge. What pressure does it exert on the floor?',
          body: { kind: 'numeric', unit: 'Pa', placeholder: 'pressure' },
          lab: { kind: 'pressure-measure', object: obj, force: f, area: a },
        },
        key: {
          body: {
            kind: 'numeric',
            value: p,
            units: ['pa', 'n/m2', 'n/m²', 'pascal', 'pascals'],
            misconceptions: [
              { value: f * a, misconceptionId: M.formula, feedback: 'Pressure is force divided by area, not force multiplied by area.' },
              { value: a / f, misconceptionId: M.formula, feedback: 'Pressure = force ÷ area (force on top).' },
            ],
          },
          answerDisplay: `${p} Pa`,
          explanation: `Pressure = force ÷ area = ${f} N ÷ ${a} m² = ${p} Pa (pascals, or N/m²).`,
        },
        hints: ['Pressure = force ÷ area.', `Work out ${f} ÷ ${a}.`],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'sci.phy.pressure-concept',
    title: 'Pressure in everyday life',
    conceptId: 'sci.phy.pressure',
    objective: 'Explain everyday situations using the relationship between area and pressure.',
    difficulty: 1,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    variables: { i: int(0, PRESSURE_EXAMPLES.length - 1) },
    build: ({ i }, rng) => {
      const ex = PRESSURE_EXAMPLES[i]
      const mcq = buildMcq(rng, [
        { text: ex.correct, correct: true },
        {
          text: ex.wrong,
          misconception: { misconceptionId: M.areaInverse, feedback: 'For the same force, a smaller area gives a larger pressure, and a larger area gives a smaller pressure.' },
        },
        { text: 'Pressure does not depend on area', misconception: { misconceptionId: M.areaInverse, feedback: 'Pressure = force ÷ area, so area matters.' } },
      ])
      return {
        view: {
          context: 'Try the brick in the sand pit first: stand it on different faces and watch how deep it sinks.',
          prompt: ex.q,
          body: mcq.view,
          lab: {
            kind: 'pressure-demo',
            weight: 30,
            faces: [
              { name: 'Lying flat', area: 0.06 },
              { name: 'On its side', area: 0.03 },
              { name: 'Standing on end', area: 0.015 },
            ],
          },
        },
        key: { body: mcq.key, answerDisplay: ex.correct, explanation: `Pressure = force ÷ area. ${ex.correct}.` },
        hints: ['For the same force, what happens to pressure when the area gets smaller?'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'sci.phy.pressure-reverse',
    title: 'Find force or area from pressure',
    conceptId: 'sci.phy.pressure',
    objective: 'Rearrange P = F ÷ A to find force or area in a new situation.',
    difficulty: 3,
    type: 'numeric',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true, transfer: true },
    variables: { mode: choice(['force', 'area'] as const), p: int(100, 2000, { step: 50 }), a: choice([0.2, 0.5, 1, 2, 4] as const) },
    build: ({ mode, p, a }) => {
      const f = Math.round(p * a * 100) / 100
      if (mode === 'force') {
        return {
          view: {
            context: 'A weather balloon platform must not sink into the mud.',
            prompt: `The mud can take a pressure of ${p} Pa and the platform’s base is ${a} m². Load it up: what is the largest force it can take without sinking?`,
            body: { kind: 'numeric', unit: 'N', placeholder: 'force' },
            lab: { kind: 'pressure-sand', mode: 'force', area: a, maxPressure: p },
          },
          key: {
            body: {
              kind: 'numeric',
              value: f,
              tolerance: 0.01,
              units: ['n', 'newton', 'newtons'],
              misconceptions: [{ value: p / a, misconceptionId: M.formula, feedback: 'Rearrange P = F ÷ A to get F = P × A.' }],
            },
            answerDisplay: `${f} N`,
            explanation: `From P = F ÷ A, force F = P × A = ${p} × ${a} = ${f} N.`,
          },
          hints: ['Start from pressure = force ÷ area.', 'Multiply both sides by the area.'],
        }
      }
      return {
        view: {
          context: 'A field rover must spread its weight so it does not sink into soft sand.',
          prompt: `The rover pushes down with ${f} N and the sand can take ${p} Pa. Try the base plates: what is the smallest base area that stops it sinking?`,
          body: { kind: 'numeric', unit: 'm²', placeholder: 'area' },
          lab: { kind: 'pressure-sand', mode: 'area', force: f, maxPressure: p, plates: [0.2, 0.5, 1, 2, 4] },
        },
        key: {
          body: {
            kind: 'numeric',
            value: a,
            tolerance: 0.01,
            units: ['m2', 'm²', 'sq m'],
            misconceptions: [{ value: Math.round(f * p * 100) / 100, misconceptionId: M.formula, feedback: 'Rearrange P = F ÷ A to get A = F ÷ P.' }],
          },
          answerDisplay: `${a} m²`,
          explanation: `From P = F ÷ A, area A = F ÷ P = ${f} ÷ ${p} = ${a} m².`,
        },
        hints: ['Start from pressure = force ÷ area.', 'Area = force ÷ pressure.'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'sci.phy.contact',
    title: 'Contact or non-contact force?',
    conceptId: 'sci.phy.forces',
    objective: 'Classify forces as contact or non-contact.',
    difficulty: 1,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { s: choice(FORCE_SITUATIONS) },
    build: ({ s }, rng) => {
      const wrong = {
        misconceptionId: M.contact,
        feedback: s.contact ? 'The objects touch each other for this force to act.' : 'This force acts even when the objects are not touching.',
      }
      const mcq = buildMcq(rng, [
        { text: 'Contact force', correct: s.contact, misconception: s.contact ? undefined : wrong },
        { text: 'Non-contact force', correct: !s.contact, misconception: s.contact ? wrong : undefined },
      ])
      return {
        view: {
          prompt: `${s.s}. Try it on the bench, then sort the force: contact or non-contact?`,
          body: mcq.view,
          lab: { kind: 'force-push', actor: s.actor, target: s.target, contact: s.contact, reaction: s.reaction },
        },
        key: {
          body: mcq.key,
          answerDisplay: s.contact ? 'Contact force' : 'Non-contact force',
          explanation: `This is ${s.type.toLowerCase()}, which is a ${s.contact ? 'contact' : 'non-contact'} force.`,
        },
        hints: ['Do the two objects need to touch for the force to act?'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'sci.phy.force-types',
    title: 'Match situations with types of force',
    conceptId: 'sci.phy.forces',
    objective: 'Identify the type of force acting in everyday situations.',
    difficulty: 2,
    type: 'match',
    review: PROTOTYPE_APPROVED,
    variables: { skip: int(0, FORCE_TYPES.length - 1) },
    build: ({ skip }, rng) => {
      const picked = FORCE_TYPES.filter((_, i) => i !== skip)
      const rightIds = rng.shuffle(['r1', 'r2', 'r3', 'r4'])
      const pairs: Record<string, string> = {}
      picked.forEach((_, i) => (pairs[`l${i}`] = rightIds[i]))
      return {
        view: {
          prompt: 'Match each situation with the force acting.',
          body: {
            kind: 'match',
            left: rng.shuffle(picked.map((p, i) => ({ id: `l${i}`, text: p.s }))),
            right: rng.shuffle(picked.map((p, i) => ({ id: rightIds[i], text: p.type }))),
          },
        },
        key: {
          body: { kind: 'match', pairs },
          answerDisplay: picked.map((p) => `${p.s} → ${p.type}`).join('; '),
          explanation: picked.map((p) => `${p.s}: ${p.type.toLowerCase()}.`).join(' '),
        },
        hints: ['Friction acts between surfaces that rub together.', 'Gravity pulls everything towards the Earth.'],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'sci.phy.atmospheric',
    title: 'Atmospheric pressure',
    conceptId: 'sci.phy.pressure',
    objective: 'Explain simple effects of atmospheric pressure.',
    difficulty: 2,
    type: 'mcq',
    review: PENDING,
    variables: { v: int(0, 0) },
    build: (_v, rng) => {
      const mcq = buildMcq(rng, [
        { text: 'Air pressure outside pushes it against the wall', correct: true },
        { text: 'The wall pulls on the rubber', misconception: { misconceptionId: M.areaInverse, feedback: 'Think about the air pushing from outside.' } },
        { text: 'Glue on the rubber holds it', misconception: { misconceptionId: M.areaInverse, feedback: 'There is no glue on a suction cup.' } },
      ])
      return {
        view: { prompt: 'Why does a rubber suction cup stick to a smooth wall after you press it?', body: mcq.view },
        key: {
          body: mcq.key,
          answerDisplay: 'Air pressure outside pushes it against the wall',
          explanation: 'Pressing squeezes air out from under the cup, so the air pressure outside is greater and holds it on.',
        },
        hints: ['What happens to the air under the cup when you press it?'],
      }
    },
  }),
]
