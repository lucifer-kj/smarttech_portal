import { cn } from '@/lib/utils/cn'

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b', undefined, null, false, 'c')).toBe('a b c')
  })
})


