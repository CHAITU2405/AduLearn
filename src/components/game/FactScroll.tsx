import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Coins, ScrollText } from 'lucide-react'
import { FACT_COINS, getFact, type Fact } from '@/content/facts'
import { walletRepo } from '@/data/repositories'
import { play } from '@/lib/sfx'

/** Opening a hidden fact scroll: shows the fact and rewards a first discovery. */
export function useFactScroll(profileId: string) {
  const [open, setOpen] = useState<{ fact: Fact; isNew: boolean } | null>(null)
  const read = useCallback(
    async (factId: string) => {
      const fact = getFact(factId)
      if (!fact) return
      const isNew = await walletRepo.findFact(profileId, factId)
      if (isNew) {
        await walletRepo.addCoins(profileId, FACT_COINS)
        play('coin')
      } else play('open')
      setOpen({ fact, isNew })
    },
    [profileId],
  )
  const modal = open ? <FactModal fact={open.fact} isNew={open.isNew} onClose={() => setOpen(null)} /> : null
  return { read, modal }
}

function FactModal({ fact, isNew, onClose }: { fact: Fact; isNew: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" role="dialog" aria-modal="true" aria-labelledby="fact-title" onClick={onClose}>
      <motion.div
        initial={{ scaleY: 0.2, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className="relative w-[min(92vw,30rem)] rounded-[2rem] border-[6px] border-[#a16207] bg-[#fef3c7] p-6 text-center shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-5 left-1/2 h-10 w-[110%] -translate-x-1/2 rounded-full bg-[#d97706]" aria-hidden />
        <div className="absolute -bottom-5 left-1/2 h-10 w-[110%] -translate-x-1/2 rounded-full bg-[#d97706]" aria-hidden />
        <ScrollText className="mx-auto mt-2 size-10 text-[#a16207]" aria-hidden />
        <p className="mt-1 text-xs font-bold tracking-widest text-[#a16207] uppercase">Hidden scroll found</p>
        <h2 id="fact-title" className="mt-1 text-3xl font-bold text-[#422006]">
          {fact.title}
        </h2>
        <p className="mt-3 text-lg leading-relaxed text-[#422006]">{fact.text}</p>
        {isNew && (
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sun px-3 py-1 font-display font-bold text-[#422006]">
            <Coins className="size-4" aria-hidden /> +{FACT_COINS} coins
          </p>
        )}
        <div className="mt-5">
          <button type="button" className="btn-game yellow" onClick={onClose} autoFocus>
            Keep exploring
          </button>
        </div>
      </motion.div>
    </div>
  )
}
