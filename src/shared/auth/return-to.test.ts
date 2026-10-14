import { describe, it, expect } from 'vitest'
import { sanitizeReturnTo } from './return-to'

describe('sanitizeReturnTo', () => {
  it('acepta las rutas permitidas', () => {
    expect(sanitizeReturnTo('/carrito')).toBe('/carrito')
    expect(sanitizeReturnTo('/consulta/inicio')).toBe('/consulta/inicio')
  })

  it.each([
    'https://evil.example',
    '//evil.example',
    '/carrito/../inicio',
    '/carrito?x=1',
    '/inicio',
    '',
    null,
    undefined,
  ])('descarta %p', (value) => {
    expect(sanitizeReturnTo(value)).toBeNull()
  })
})
