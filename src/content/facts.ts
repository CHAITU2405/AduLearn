/** Collectible "fact scrolls" hidden around the world. Short, accurate, curiosity-sparking. */
export interface Fact {
  id: string
  title: string
  text: string
  subject: 'english' | 'mathematics' | 'science' | 'general'
  /** Where on the map the scroll is hidden (shown as a hint before it is found). */
  where: string
}

export const FACTS: Fact[] = [
  {
    id: 'fact-lighthouse',
    title: 'The Lighthouse Lens',
    text: 'Many lighthouses use a special Fresnel lens made of rings of glass. It bends light into a strong beam that ships can see from far out at sea.',
    subject: 'science',
    where: 'Isle of Learning — Old Lighthouse',
  },
  {
    id: 'fact-falls',
    title: 'Water Power',
    text: 'Falling water can spin turbines to make electricity. This is called hydroelectric power — it changes the energy of moving water into electrical energy.',
    subject: 'science',
    where: 'Isle of Learning — Rainbow Falls',
  },
  {
    id: 'fact-grove',
    title: 'Breathing Leaves',
    text: 'Leaves have tiny pores called stomata. Plants lose water vapour through them — a process called transpiration — which helps pull water up from the roots.',
    subject: 'science',
    where: 'Isle of Learning — Ancient Grove',
  },
  {
    id: 'fact-equals',
    title: 'Who Invented “=”?',
    text: 'The equals sign was introduced by Robert Recorde in 1557. He chose two parallel lines because, he said, no two things could be more equal.',
    subject: 'mathematics',
    where: 'Realm of Numbers — Old Milestone',
  },
  {
    id: 'fact-alphabet',
    title: 'Alpha + Beta',
    text: 'The word “alphabet” comes from alpha and beta, the names of the first two letters of the Greek alphabet.',
    subject: 'english',
    where: 'Kingdom of Words — Wishing Fountain',
  },
  {
    id: 'fact-cell',
    title: 'Naming the Cell',
    text: 'In 1665 Robert Hooke looked at thin slices of cork through a microscope. The tiny boxes reminded him of small rooms, so he called them “cells”.',
    subject: 'science',
    where: 'Frontier of Discovery — Crystal Cave',
  },
]

export const FACT_COINS = 5
export const getFact = (id: string) => FACTS.find((f) => f.id === id)
