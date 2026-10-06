import { describe, it, expect } from 'vitest'
import {
  AGE_RANGES,
  buildPlanCode,
  EMPTY_PLAN_SELECTION,
  isPlanSelectionComplete,
  isValidHeightCm,
  PLAN_SLUGS,
  type PlanSelection,
} from './plan-code'
import { PLANS } from './data'

const complete: PlanSelection = {
  weightRange: '50-60',
  heightCm: '175',
  sex: 'm',
  ageRange: '18-30',
}

describe('buildPlanCode', () => {
  it('arma el código <plan>-<pesoMin>-<pesoMax>-<sexo>-<edad>', () => {
    expect(buildPlanCode('plan-gimnasio-volumen', complete)).toBe('plan-gimnasio-volumen-50-60-m-joven')
    expect(
      buildPlanCode('plan-gimnasio-definicion', { ...complete, weightRange: '70-80', sex: 'f', ageRange: '40-50' }),
    ).toBe('plan-gimnasio-definicion-70-80-f-adulto')
  })

  it('soporta planes con guiones en el nombre y el rango 100-120', () => {
    expect(buildPlanCode('plan-deporte-cancha', { ...complete, weightRange: '100-120' })).toBe(
      'plan-deporte-cancha-100-120-m-joven',
    )
  })

  it('solo 18-30 es "joven"; el resto de los rangos de edad es "adulto"', () => {
    const groups = AGE_RANGES.map(
      (range) => buildPlanCode('plan-running', { ...complete, ageRange: range.value })!.split('-').pop(),
    )
    expect(groups).toEqual(['joven', 'adulto', 'adulto', 'adulto', 'adulto'])
  })

  it('la talla no cambia la versión elegida', () => {
    expect(buildPlanCode('plan-gimnasio-volumen', { ...complete, heightCm: '150' })).toBe(
      buildPlanCode('plan-gimnasio-volumen', { ...complete, heightCm: '199' }),
    )
  })

  it('devuelve null si la selección está incompleta', () => {
    expect(buildPlanCode('plan-gimnasio-volumen', EMPTY_PLAN_SELECTION)).toBeNull()
    expect(buildPlanCode('plan-gimnasio-volumen', { ...complete, weightRange: '' })).toBeNull()
    expect(buildPlanCode('plan-gimnasio-volumen', { ...complete, sex: '' })).toBeNull()
    expect(buildPlanCode('plan-gimnasio-volumen', { ...complete, ageRange: '' })).toBeNull()
    expect(buildPlanCode('plan-gimnasio-volumen', { ...complete, heightCm: '' })).toBeNull()
  })

  it('devuelve null si el plan no existe', () => {
    expect(buildPlanCode('plan-futbol', complete)).toBeNull()
  })
})

describe('isValidHeightCm / isPlanSelectionComplete', () => {
  it.each(['150', '175.5', '1'])('acepta la talla %s', (value) => {
    expect(isValidHeightCm(value)).toBe(true)
  })

  it.each(['', '  ', '0', '-10', 'abc', '301'])('rechaza la talla %p', (value) => {
    expect(isValidHeightCm(value)).toBe(false)
  })

  it('la selección está completa solo con los 4 campos válidos', () => {
    expect(isPlanSelectionComplete(complete)).toBe(true)
    expect(isPlanSelectionComplete({ ...complete, heightCm: '0' })).toBe(false)
    expect(isPlanSelectionComplete(EMPTY_PLAN_SELECTION)).toBe(false)
  })
})

describe('PLANS', () => {
  it('coincide con los slugs de plan que reconoce el backend', () => {
    expect(PLANS.map((plan) => plan.slug).sort()).toEqual([...PLAN_SLUGS].sort())
  })
})
