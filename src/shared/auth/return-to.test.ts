import { describe, it, expect } from 'vitest'
import { sanitizeReturnTo } from './return-to'

describe('sanitizeReturnTo', () => {
  it('acepta las rutas permitidas', () => {
    expect(sanitizeReturnTo('/carrito')).toBe('/carrito')
  })

  it.each([
    'https://evil.example',
    '//evil.example',
    '/carrito/../panel',
    '/carrito?x=1',
    '/panel',
    '',
    null,
    undefined,
  ])('descarta %p', (value) => {
    expect(sanitizeReturnTo(value)).toBeNull()
  })
})
