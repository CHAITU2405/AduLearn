/**
 * ILLUSTRATIVE SAMPLE CONTENT — Mathematics, "Bridge of Balance".
 * Topic: linear equations in one variable (a typical Class 8 topic).
 * Not yet verified against the official AP SSC Class 8 textbook.
 */
import { buildMcq, choice, defineTemplate, DRAFT, ILLUSTRATIVE, int, PENDING, PROTOTYPE_APPROVED, signed } from '@/core/content/define'
import type { QuestionTemplate } from '@/core/content/types'

const CH = 'math-equations'
const base = { version: 1, grade: 8 as const, subject: 'mathematics' as const, chapterId: CH, curriculum: ILLUSTRATIVE }

const M = {
  inverse: 'math.inverse-operation',
  order: 'math.undo-order',
  sign: 'math.sign-error',
  setup: 'math.equation-setup',
  partial: 'math.partial-solution',
  balance: 'math.balance',
}

const PLANK_CONTEXTS = [
  { who: 'Engineer Ira', thing: 'planks' },
  { who: 'The bridge crew', thing: 'rope coils' },
  { who: 'Ira’s apprentice', thing: 'stone blocks' },
] as const

export const mathTemplates: QuestionTemplate[] = [
  // ---------------------------------------------------------------- one-step
  defineTemplate({
    ...base,
    id: 'math.eq.add-one-step',
    title: 'One-step equation: x + a = b',
    conceptId: 'math.eq.one-step',
    objective: 'Solve x + a = b by subtracting a from both sides.',
    difficulty: 1,
    type: 'numeric',
    review: PROTOTYPE_APPROVED,
    variables: { x: int(3, 40), a: int(2, 25), ctx: choice(PLANK_CONTEXTS) },
    build: ({ x, a, ctx }) => {
      const b = x + a
      return {
        view: {
          context: `${ctx.who} had some ${ctx.thing}. After ${a} more arrived, there are ${b}.`,
          prompt: `Solve for x:  x + ${a} = ${b}`,
          body: { kind: 'numeric', placeholder: 'x = ?' },
        },
        key: {
          body: {
            kind: 'numeric',
            value: x,
            misconceptions: [{ value: b + a, misconceptionId: M.inverse, feedback: `You added ${a}. To undo “+ ${a}”, subtract ${a} instead.` }],
          },
          answerDisplay: `x = ${x}`,
          explanation: `Subtract ${a} from both sides: x + ${a} − ${a} = ${b} − ${a}, so x = ${x}. Check: ${x} + ${a} = ${b}. ✓`,
        },
        hints: [`To undo “+ ${a}”, do the opposite to both sides.`, `Work out ${b} − ${a}.`],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'math.eq.sub-one-step',
    title: 'One-step equation: x − a = b',
    conceptId: 'math.eq.one-step',
    objective: 'Solve x − a = b by adding a to both sides.',
    difficulty: 1,
    type: 'numeric',
    review: PROTOTYPE_APPROVED,
    variables: { a: int(3, 30), b: int(2, 40), ctx: choice(PLANK_CONTEXTS) },
    build: ({ a, b, ctx }) => {
      const x = a + b
      return {
        view: {
          context: `${ctx.who} used ${a} ${ctx.thing} and ${b} are left.`,
          prompt: `Solve for x:  x − ${a} = ${b}`,
          body: { kind: 'numeric', placeholder: 'x = ?' },
        },
        key: {
          body: {
            kind: 'numeric',
            value: x,
            misconceptions: [{ value: b - a, misconceptionId: M.inverse, feedback: `You subtracted ${a}. To undo “− ${a}”, add ${a} instead.` }],
          },
          answerDisplay: `x = ${x}`,
          explanation: `Add ${a} to both sides: x − ${a} + ${a} = ${b} + ${a}, so x = ${x}. Check: ${x} − ${a} = ${b}. ✓`,
        },
        hints: [`To undo “− ${a}”, do the opposite to both sides.`, `Work out ${b} + ${a}.`],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'math.eq.mul-one-step',
    title: 'One-step equation: ax = b',
    conceptId: 'math.eq.one-step',
    objective: 'Solve ax = b by dividing both sides by a.',
    difficulty: 2,
    type: 'numeric',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { a: int(2, 12), x: int(2, 15) },
    build: ({ a, x }) => {
      const b = a * x
      return {
        view: {
          context: `Each support beam weighs the same. ${a} beams weigh ${b} kg altogether.`,
          prompt: `Solve for x:  ${a}x = ${b}`,
          body: { kind: 'numeric', placeholder: 'x = ?' },
        },
        key: {
          body: {
            kind: 'numeric',
            value: x,
            misconceptions: [
              { value: b * a, misconceptionId: M.inverse, feedback: `You multiplied by ${a}. “${a}x” means ${a} × x, so divide by ${a} to undo it.` },
              { value: b - a, misconceptionId: M.inverse, feedback: `“${a}x” means ${a} × x, not ${a} + x. Undo multiplication by dividing.` },
            ],
          },
          answerDisplay: `x = ${x}`,
          explanation: `Divide both sides by ${a}: ${a}x ÷ ${a} = ${b} ÷ ${a}, so x = ${x}. Check: ${a} × ${x} = ${b}. ✓`,
        },
        hints: [`${a}x means ${a} × x. What undoes multiplying by ${a}?`, `Work out ${b} ÷ ${a}.`],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'math.eq.div-one-step',
    title: 'One-step equation: x ÷ a = b',
    conceptId: 'math.eq.one-step',
    objective: 'Solve x ÷ a = b by multiplying both sides by a.',
    difficulty: 2,
    type: 'numeric',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { a: int(2, 9), b: int(2, 14) },
    build: ({ a, b }) => {
      const x = a * b
      return {
        view: {
          context: `A rope was cut into ${a} equal pieces. Each piece is ${b} m long.`,
          prompt: `Solve for x:  x ÷ ${a} = ${b}`,
          body: { kind: 'numeric', unit: 'm', placeholder: 'x = ?' },
        },
        key: {
          body: {
            kind: 'numeric',
            value: x,
            units: ['m'],
            misconceptions: [{ value: b / a, misconceptionId: M.inverse, feedback: `You divided again. To undo “÷ ${a}”, multiply by ${a}.` }],
          },
          answerDisplay: `x = ${x}`,
          explanation: `Multiply both sides by ${a}: (x ÷ ${a}) × ${a} = ${b} × ${a}, so x = ${x}. Check: ${x} ÷ ${a} = ${b}. ✓`,
        },
        hints: [`What undoes dividing by ${a}?`, `Work out ${b} × ${a}.`],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'math.eq.inverse-choice',
    title: 'Choose the inverse operation',
    conceptId: 'math.eq.one-step',
    objective: 'Identify the inverse operation that isolates x.',
    difficulty: 1,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    variables: { op: choice(['add', 'sub', 'mul', 'div'] as const), a: int(2, 9), k: int(3, 12) },
    build: ({ op, a, k }, rng) => {
      const eq = { add: `x + ${a} = ${a + k}`, sub: `x − ${a} = ${k}`, mul: `${a}x = ${a * k}`, div: `x ÷ ${a} = ${k}` }[op]
      const correctOp = { add: 'sub', sub: 'add', mul: 'div', div: 'mul' }[op]
      const label = { add: `Add ${a}`, sub: `Subtract ${a}`, mul: `Multiply by ${a}`, div: `Divide by ${a}` }
      const same = { misconceptionId: M.inverse, feedback: 'Doing the same operation again moves x further away. Use the opposite (inverse) operation.' }
      const mcq = buildMcq(
        rng,
        (['add', 'sub', 'mul', 'div'] as const).map((o) => ({ text: label[o], correct: o === correctOp, misconception: o === op ? same : undefined })),
      )
      return {
        view: { context: 'Ira wants x alone on one side of the balance.', prompt: `To solve ${eq}, what should you do to both sides?`, body: mcq.view },
        key: {
          body: mcq.key,
          answerDisplay: label[correctOp as keyof typeof label],
          explanation: `Each operation has an inverse: + and − undo each other, × and ÷ undo each other. In ${eq}, x is combined with ${a} by ${{ add: 'addition', sub: 'subtraction', mul: 'multiplication', div: 'division' }[op]}, so we ${label[correctOp as keyof typeof label].toLowerCase()} on both sides.`,
        },
        hints: ['Look at what is being done to x.', 'Choose the operation that undoes it.'],
      }
    },
  }),

  // ---------------------------------------------------------------- two-step
  defineTemplate({
    ...base,
    id: 'math.eq.two-step-basic',
    title: 'Two-step equation: ax + b = c',
    conceptId: 'math.eq.two-step',
    objective: 'Solve ax + b = c by undoing addition, then multiplication.',
    difficulty: 2,
    type: 'numeric',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { a: int(2, 9), x: int(1, 12), b: int(1, 20) },
    build: ({ a, x, b }) => {
      const c = a * x + b
      return {
        view: {
          context: `The rope lift holds ${a} equal crates plus a ${b} kg basket. The total load is ${c} kg.`,
          prompt: `Solve for x:  ${a}x + ${b} = ${c}`,
          body: { kind: 'numeric', placeholder: 'x = ?' },
        },
        key: {
          body: {
            kind: 'numeric',
            value: x,
            misconceptions: [
              { value: (c + b) / a, misconceptionId: M.sign, feedback: `It looks like ${b} was added. To remove “+ ${b}”, subtract ${b} from both sides.` },
              { value: c / a - b, misconceptionId: M.order, feedback: `Undo the steps in reverse order: remove the “+ ${b}” first, then divide by ${a}.` },
            ],
          },
          answerDisplay: `x = ${x}`,
          explanation: `Step 1: subtract ${b} from both sides → ${a}x = ${c - b}. Step 2: divide both sides by ${a} → x = ${x}. Check: ${a} × ${x} + ${b} = ${c}. ✓`,
        },
        hints: [`First remove the “+ ${b}” from the left side.`, `After step 1 you should have ${a}x = ${c - b}.`],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'math.eq.two-step-explain',
    title: 'Identify a step in a two-step solution',
    conceptId: 'math.eq.two-step',
    objective: 'Recognise that the same operation must be applied to both sides.',
    difficulty: 2,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { a: int(2, 9), x: int(1, 12), b: int(2, 20) },
    build: ({ a, x, b }, rng) => {
      const c = a * x + b
      const mcq = buildMcq(rng, [
        { text: `Subtracted ${b} from both sides`, correct: true },
        { text: `Added ${b} to both sides`, misconception: { misconceptionId: M.sign, feedback: `Adding ${b} would give ${c + b} on the right, not ${c - b}.` } },
        { text: `Divided both sides by ${a}`, misconception: { misconceptionId: M.order, feedback: `Dividing by ${a} would not leave ${a}x on the left.` } },
        {
          text: `Subtracted ${b} from the left side only`,
          misconception: { misconceptionId: M.balance, feedback: 'An equation is like a balance: whatever you do to one side, you must do to the other.' },
        },
      ])
      return {
        view: {
          context: 'Ira wrote her working on the bridge plan.',
          prompt: `She solved ${a}x + ${b} = ${c}.  Step 1 gave: ${a}x = ${c - b}.  What did she do in step 1?`,
          body: mcq.view,
        },
        key: {
          body: mcq.key,
          answerDisplay: `Subtracted ${b} from both sides`,
          explanation: `${c} − ${b} = ${c - b}, and subtracting ${b} on the left removes the “+ ${b}”. Doing it to both sides keeps the equation balanced.`,
        },
        hints: [`Compare the right side before (${c}) and after (${c - b}).`],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'math.eq.two-step-negative',
    title: 'Two-step equation with subtraction: ax − b = c',
    conceptId: 'math.eq.two-step',
    objective: 'Solve ax − b = c, including negative solutions.',
    difficulty: 3,
    type: 'numeric',
    review: PROTOTYPE_APPROVED,
    variables: { a: int(2, 8), x: int(-8, 12, { exclude: [0] }), b: int(2, 18) },
    build: ({ a, x, b }) => {
      const c = a * x - b
      return {
        view: {
          context: 'The river level is measured from a marker on the bridge pillar.',
          prompt: `Solve for x:  ${a}x − ${b} = ${c}`,
          body: { kind: 'numeric', placeholder: 'x = ?' },
        },
        key: {
          body: {
            kind: 'numeric',
            value: x,
            misconceptions: [{ value: (c - b) / a, misconceptionId: M.sign, feedback: `To remove “− ${b}”, add ${b} to both sides (not subtract).` }],
          },
          answerDisplay: `x = ${x}`,
          explanation: `Add ${b} to both sides → ${a}x = ${c + b}. Divide by ${a} → x = ${x}. Check: ${a} × (${x}) − ${b} = ${c}. ✓`,
        },
        hints: [`Undo “− ${b}” first.`, `You should reach ${a}x = ${c + b}. The answer can be negative.`],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'math.eq.two-step-divide',
    title: 'Two-step equation: x ÷ a + b = c',
    conceptId: 'math.eq.two-step',
    objective: 'Solve x ÷ a + b = c by undoing addition, then division.',
    difficulty: 3,
    type: 'numeric',
    review: PROTOTYPE_APPROVED,
    variables: { a: int(2, 6), k: int(1, 9), b: int(1, 15) },
    build: ({ a, k, b }) => {
      const c = k + b
      const x = a * k
      return {
        view: {
          context: `x planks are shared equally between ${a} teams. Each team then gets ${b} spare planks and ends up with ${c}.`,
          prompt: `Solve for x:  x ÷ ${a} + ${b} = ${c}`,
          body: { kind: 'numeric', placeholder: 'x = ?' },
        },
        key: {
          body: {
            kind: 'numeric',
            value: x,
            misconceptions: [
              { value: c * a - b, misconceptionId: M.order, feedback: `Undo in reverse order: subtract ${b} first, then multiply by ${a}.` },
              { value: (c + b) * a, misconceptionId: M.sign, feedback: `To remove “+ ${b}”, subtract ${b} from both sides.` },
            ],
          },
          answerDisplay: `x = ${x}`,
          explanation: `Subtract ${b} → x ÷ ${a} = ${k}. Multiply by ${a} → x = ${x}. Check: ${x} ÷ ${a} + ${b} = ${c}. ✓`,
        },
        hints: [`Remove the “+ ${b}” first.`, `Then undo “÷ ${a}”.`],
      }
    },
  }),

  // ---------------------------------------------------------------- both sides
  defineTemplate({
    ...base,
    id: 'math.eq.both-simple',
    title: 'Variable on both sides: ax = cx + d',
    conceptId: 'math.eq.both-sides',
    objective: 'Collect the x terms on one side, then solve.',
    difficulty: 2,
    type: 'numeric',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { a: int(3, 9), c: int(1, 8), x: int(1, 12) },
    constraint: ({ a, c }) => (c < a ? null : 'c must be smaller than a'),
    build: ({ a, c, x }) => {
      const d = (a - c) * x
      return {
        view: {
          context: 'Two sides of the scale must balance.',
          prompt: `Solve for x:  ${a}x = ${c}x + ${d}`,
          body: { kind: 'numeric', placeholder: 'x = ?' },
        },
        key: {
          body: {
            kind: 'numeric',
            value: x,
            misconceptions: [{ value: d / (a + c), misconceptionId: M.sign, feedback: `Moving ${c}x to the left means subtracting it: ${a}x − ${c}x = ${a - c}x.` }],
          },
          answerDisplay: `x = ${x}`,
          explanation: `Subtract ${c}x from both sides → ${a - c}x = ${d}. Divide by ${a - c} → x = ${x}. Check: ${a} × ${x} = ${a * x} and ${c} × ${x} + ${d} = ${c * x + d}. ✓`,
        },
        hints: [`Get all the x terms on one side by subtracting ${c}x from both sides.`, `You should reach ${a - c}x = ${d}.`],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'math.eq.both-full',
    title: 'Variable on both sides: ax + b = cx + d',
    conceptId: 'math.eq.both-sides',
    objective: 'Solve ax + b = cx + d, including negative solutions.',
    difficulty: 3,
    type: 'numeric',
    review: PROTOTYPE_APPROVED,
    variables: { a: int(3, 9), c: int(1, 8), x: int(-5, 10, { exclude: [0] }), b: int(1, 15) },
    constraint: ({ a, c }) => (c < a ? null : 'c must be smaller than a'),
    build: ({ a, c, x, b }) => {
      const d = (a - c) * x + b
      return {
        view: {
          context: 'Balance the scales so the bridge stays level.',
          prompt: `Solve for x:  ${a}x ${signed(b)} = ${c}x ${signed(d)}`,
          body: { kind: 'numeric', placeholder: 'x = ?' },
        },
        key: {
          body: {
            kind: 'numeric',
            value: x,
            misconceptions: [
              { value: (d + b) / (a - c), misconceptionId: M.sign, feedback: `Moving “+ ${b}” to the right means subtracting ${b}.` },
              { value: (d - b) / (a + c), misconceptionId: M.sign, feedback: `Moving ${c}x to the left means subtracting it, giving ${a - c}x.` },
            ],
          },
          answerDisplay: `x = ${x}`,
          explanation: `Subtract ${c}x from both sides → ${a - c}x ${signed(b)} = ${d}. Subtract ${b} → ${a - c}x = ${d - b}. Divide by ${a - c} → x = ${x}.`,
        },
        hints: ['Collect x terms on the left and numbers on the right.', `You should reach ${a - c}x = ${d - b}.`],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'math.eq.both-collect',
    title: 'Choose the correct collecting step',
    conceptId: 'math.eq.both-sides',
    objective: 'Recognise a correct step when collecting like terms across the equals sign.',
    difficulty: 2,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { a: int(4, 9), c: int(1, 3), b: int(1, 12), d: int(14, 40) },
    build: ({ a, c, b, d }, rng) => {
      const mcq = buildMcq(rng, [
        { text: `${a - c}x + ${b} = ${d}`, correct: true },
        { text: `${a + c}x + ${b} = ${d}`, misconception: { misconceptionId: M.sign, feedback: `Subtracting ${c}x from ${a}x gives ${a - c}x, not ${a + c}x.` } },
        { text: `${a}x = ${c}x + ${d + b}`, misconception: { misconceptionId: M.sign, feedback: `Moving “+ ${b}” across means subtracting it: ${d} − ${b}.` } },
        { text: `${a - c}x = ${d + b}`, misconception: { misconceptionId: M.sign, feedback: `Subtracting ${b} from both sides gives ${d - b}, not ${d + b}.` } },
      ])
      return {
        view: { prompt: `Which line correctly shows the result of subtracting ${c}x from both sides of ${a}x + ${b} = ${c}x + ${d}?`, body: mcq.view },
        key: {
          body: mcq.key,
          answerDisplay: `${a - c}x + ${b} = ${d}`,
          explanation: `${a}x − ${c}x = ${a - c}x on the left; ${c}x − ${c}x = 0 on the right, leaving ${d}. The “+ ${b}” is not changed by this step.`,
        },
        hints: [`Only the x terms change in this step.`],
      }
    },
  }),

  // ---------------------------------------------------------------- word problems
  defineTemplate({
    ...base,
    id: 'math.eq.word-ages',
    title: 'Word problem: ages',
    conceptId: 'math.eq.word',
    objective: 'Form and solve an equation from a story about ages.',
    difficulty: 2,
    type: 'numeric',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { x: int(8, 15), m: int(2, 4), who: choice(['uncle', 'aunt', 'grandmother', 'older cousin'] as const) },
    build: ({ x, m, who }) => {
      const total = x * (m + 1)
      const times = { 2: 'twice', 3: 'three times', 4: 'four times' }[m] ?? `${m} times`
      return {
        view: {
          context: 'The bridge crew are sharing stories at lunch.',
          prompt: `Ira's ${who} is ${times} as old as Ira. Together their ages add up to ${total} years. How old is Ira?`,
          body: { kind: 'numeric', unit: 'years', placeholder: 'Ira’s age' },
        },
        key: {
          body: {
            kind: 'numeric',
            value: x,
            units: ['years', 'year', 'yrs'],
            misconceptions: [
              { value: total / m, misconceptionId: M.setup, feedback: `Remember to include Ira's own age: x + ${m}x = ${total}.` },
              { value: m * x, misconceptionId: M.partial, feedback: `That is the ${who}'s age. The question asks for Ira's age.` },
            ],
          },
          answerDisplay: `${x} years`,
          explanation: `Let Ira's age be x. The ${who} is ${m}x. So x + ${m}x = ${total}, which gives ${m + 1}x = ${total} and x = ${x}.`,
        },
        hints: [`Let Ira's age be x. Then the ${who}'s age is ${m}x.`, `Add the two ages: x + ${m}x = ${total}.`],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'math.eq.word-perimeter',
    title: 'Word problem: rectangle perimeter',
    conceptId: 'math.eq.word',
    objective: 'Form and solve an equation from a perimeter problem.',
    difficulty: 2,
    type: 'numeric',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { w: int(3, 20), d: int(2, 10) },
    build: ({ w, d }) => {
      const p = 2 * (2 * w + d)
      return {
        view: {
          context: 'The crew is fencing a rectangular rest area next to the bridge.',
          prompt: `The length of the rest area is ${d} m more than its width. Its perimeter is ${p} m. What is the width?`,
          body: { kind: 'numeric', unit: 'm', placeholder: 'width' },
        },
        key: {
          body: {
            kind: 'numeric',
            value: w,
            units: ['m', 'metres', 'meters'],
            misconceptions: [
              { value: w + d, misconceptionId: M.partial, feedback: 'That is the length. The question asks for the width.' },
              { value: (p - d) / 4, misconceptionId: M.setup, feedback: `Perimeter = 2 × (length + width) = 2(x + ${d} + x). The ${d} appears twice.` },
            ],
          },
          answerDisplay: `${w} m`,
          explanation: `Let the width be x. Length = x + ${d}. Perimeter: 2(x + x + ${d}) = ${p} → 4x + ${2 * d} = ${p} → 4x = ${p - 2 * d} → x = ${w}.`,
        },
        hints: [`Let the width be x, so the length is x + ${d}.`, `Perimeter = 2 × (length + width).`],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'math.eq.word-consecutive',
    title: 'Word problem: consecutive numbers',
    conceptId: 'math.eq.word',
    objective: 'Represent consecutive numbers algebraically and solve.',
    difficulty: 3,
    type: 'numeric',
    review: PROTOTYPE_APPROVED,
    variables: { n: int(5, 60) },
    build: ({ n }) => {
      const s = 3 * n + 3
      return {
        view: {
          context: 'Three bridge posts are numbered with consecutive whole numbers.',
          prompt: `The three post numbers add up to ${s}. What is the smallest post number?`,
          body: { kind: 'numeric', placeholder: 'smallest number' },
        },
        key: {
          body: {
            kind: 'numeric',
            value: n,
            misconceptions: [
              { value: s / 3, misconceptionId: M.partial, feedback: 'Dividing by 3 gives the middle number. The question asks for the smallest.' },
              { value: n + 2, misconceptionId: M.partial, feedback: 'That is the largest number. The question asks for the smallest.' },
            ],
          },
          answerDisplay: `${n}`,
          explanation: `Let the numbers be x, x + 1 and x + 2. Then 3x + 3 = ${s} → 3x = ${s - 3} → x = ${n}. The posts are ${n}, ${n + 1} and ${n + 2}.`,
        },
        hints: ['Call the smallest number x. What are the next two?', `x + (x + 1) + (x + 2) = ${s}`],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'math.eq.word-choose',
    title: 'Choose the equation for a story',
    conceptId: 'math.eq.word',
    objective: 'Translate a story into an equation.',
    difficulty: 2,
    type: 'mcq',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true },
    variables: { n: int(3, 9), x: int(12, 45), p: int(5, 30), item: choice(['notebooks', 'paint tins', 'lanterns'] as const) },
    build: ({ n, x, p, item }, rng) => {
      const t = n * x + p
      const mcq = buildMcq(rng, [
        { text: `${n}x + ${p} = ${t}`, correct: true },
        { text: `${n} + x + ${p} = ${t}`, misconception: { misconceptionId: M.setup, feedback: `${n} items at ₹x each cost ${n} × x, written ${n}x.` } },
        { text: `x + ${p} = ${t}`, misconception: { misconceptionId: M.setup, feedback: `This counts only one item. There are ${n}.` } },
        { text: `${n}x = ${t} + ${p}`, misconception: { misconceptionId: M.sign, feedback: `The ₹${p} is part of the total, so it is added on the left, not to ${t}.` } },
      ])
      return {
        view: {
          prompt: `Ravi buys ${n} ${item} at ₹x each and a brush for ₹${p}. He pays ₹${t} in total. Which equation describes this?`,
          body: mcq.view,
        },
        key: {
          body: mcq.key,
          answerDisplay: `${n}x + ${p} = ${t}`,
          explanation: `${n} ${item} at ₹x each cost ${n}x. Adding the brush gives ${n}x + ${p}, which equals the total ₹${t}.`,
        },
        hints: [`What is the cost of ${n} ${item} at ₹x each?`],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'math.eq.word-cables-multi',
    title: 'Multi-step: form and solve (cables)',
    conceptId: 'math.eq.word',
    objective: 'Form an equation from a new context and solve it (transfer).',
    difficulty: 3,
    type: 'multi',
    review: PROTOTYPE_APPROVED,
    assessment: { eligible: true, transfer: true },
    variables: { n: int(3, 8), x: int(4, 20), e: int(2, 15) },
    build: ({ n, x, e }, rng) => {
      const t = n * x + e
      const mcq = buildMcq(
        rng,
        [
          { text: `${n}x + ${e} = ${t}`, correct: true },
          { text: `${n}x = ${t} + ${e}`, misconception: { misconceptionId: M.sign, feedback: 'The spare piece is part of the total length.' } },
          { text: `x + ${e} = ${t}`, misconception: { misconceptionId: M.setup, feedback: `There are ${n} equal cables, so their length is ${n}x.` } },
          { text: `${n} + x + ${e} = ${t}`, misconception: { misconceptionId: M.setup, feedback: `${n} cables of length x make ${n}x.` } },
        ],
        'Step 1: Which equation fits?',
      )
      return {
        view: {
          context: 'The storm has snapped the suspension cables!',
          prompt: `The bridge needs ${n} equal cables plus one spare piece of ${e} m. Altogether ${t} m of cable is used. Let each cable be x m long.`,
          body: { kind: 'multi', parts: [mcq.view, { kind: 'numeric', prompt: 'Step 2: How long is each cable?', unit: 'm', placeholder: 'x = ?' }] },
        },
        key: {
          body: {
            kind: 'multi',
            parts: [
              mcq.key,
              {
                kind: 'numeric',
                value: x,
                units: ['m', 'metres', 'meters'],
                misconceptions: [{ value: (t + e) / n, misconceptionId: M.sign, feedback: `Subtract the ${e} m spare piece before dividing.` }],
              },
            ],
          },
          answerDisplay: `${n}x + ${e} = ${t}, so x = ${x} m`,
          explanation: `${n} cables of x m plus ${e} m gives ${n}x + ${e} = ${t}. Subtract ${e} → ${n}x = ${t - e}. Divide by ${n} → x = ${x} m.`,
        },
        hints: [`${n} equal cables of x m each is ${n}x metres.`, `After forming the equation, undo “+ ${e}” first.`],
      }
    },
  }),

  // ---------------------------------------------------------------- not yet approved (review workflow demo)
  defineTemplate({
    ...base,
    id: 'math.eq.fraction-both',
    title: 'Equations with fractions: x/a + x/b = c',
    conceptId: 'math.eq.both-sides',
    objective: 'Solve equations containing fractional terms.',
    difficulty: 3,
    type: 'numeric',
    review: PENDING,
    variables: { a: choice([2, 3, 4] as const), b: choice([3, 4, 6] as const), m: int(1, 6) },
    constraint: ({ a, b }) => (a !== b ? null : 'a and b must differ'),
    build: ({ a, b, m }) => {
      const gcd = (p: number, q: number): number => (q === 0 ? p : gcd(q, p % q))
      const l = (a * b) / gcd(a, b)
      const x = m * l
      const c = x / a + x / b
      return {
        view: { prompt: `Solve for x:  x/${a} + x/${b} = ${c}`, body: { kind: 'numeric', placeholder: 'x = ?' } },
        key: {
          body: { kind: 'numeric', value: x },
          answerDisplay: `x = ${x}`,
          explanation: `Multiply every term by ${l} (the LCM of ${a} and ${b}): ${l / a}x + ${l / b}x = ${c * l} → ${l / a + l / b}x = ${c * l} → x = ${x}.`,
        },
        hints: [`Multiply every term by the LCM of ${a} and ${b}.`],
      }
    },
  }),
  defineTemplate({
    ...base,
    id: 'math.eq.decimal-one-step',
    title: 'One-step equations with decimals',
    conceptId: 'math.eq.one-step',
    objective: 'Solve x + a = b where a and b are decimals.',
    difficulty: 2,
    type: 'numeric',
    review: DRAFT,
    variables: { x10: int(5, 99), a10: int(5, 99) },
    build: ({ x10, a10 }) => {
      const x = x10 / 10
      const a = a10 / 10
      const b = (x10 + a10) / 10
      return {
        view: { prompt: `Solve for x:  x + ${a} = ${b}`, body: { kind: 'numeric', placeholder: 'x = ?' } },
        key: { body: { kind: 'numeric', value: x, tolerance: 0.001 }, answerDisplay: `x = ${x}`, explanation: `Subtract ${a} from both sides: x = ${b} − ${a} = ${x}.` },
        hints: [`Subtract ${a} from both sides.`],
      }
    },
  }),
]
