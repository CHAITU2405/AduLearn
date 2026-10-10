import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_AVATAR } from '@/core/avatar'
import { AvatarEditor, randomAvatar } from './AvatarEditor'

describe('AvatarEditor', () => {
  it('only offers wardrobe items the explorer owns', () => {
    const { rerender } = render(<AvatarEditor value={DEFAULT_AVATAR} onChange={vi.fn()} />)
    expect(screen.queryByText('Scholar crown')).not.toBeInTheDocument()
    expect(screen.queryByText('Jetpack')).not.toBeInTheDocument()
    expect(screen.getByText('Glasses')).toBeInTheDocument()
    rerender(<AvatarEditor value={DEFAULT_AVATAR} onChange={vi.fn()} owned={['acc-crown']} />)
    expect(screen.getByText('Scholar crown')).toBeInTheDocument()
    expect(screen.queryByText('Jetpack')).not.toBeInTheDocument()
  })

  it('"Surprise me" never hands out wardrobe items for free', () => {
    for (let i = 0; i < 200; i++) {
      const a = randomAvatar()
      expect(['explorer-hat', 'headphones', 'flower', 'crown']).not.toContain(a.accessory)
      expect(a.backpack).not.toBe('jetpack')
      expect(a.outfit).not.toBe('cape')
    }
  })
})
