import { describe, it, expect } from 'vitest';
import { macroDistribution } from './macro-distribution';

describe('macroDistribution', () => {
  it('calcula el % de cada macronutriente sobre sus calorías (4/4/9 kcal por gramo)', () => {
    // 200 g carbo = 800 kcal, 150 g proteína = 600 kcal, 60 g lípidos = 540 kcal → 1940 kcal
    // exactos: 41.24 %, 30.93 %, 27.84 % → resto mayor: 41, 31, 28
    const shares = macroDistribution({ carbohydrate: 200, protein: 150, fat: 60 });

    expect(shares.map(({ key, grams, percentage }) => [key, grams, percentage])).toEqual([
      ['carbohydrate', 200, 41],
      ['protein', 150, 31],
      ['fat', 60, 28],
    ]);
  });

  it('los tres porcentajes suman siempre 100', () => {
    for (const macros of [
      { carbohydrate: 1, protein: 1, fat: 1 },
      { carbohydrate: 330, protein: 120, fat: 70 },
      { carbohydrate: 55, protein: 0, fat: 0 },
    ]) {
      expect(macroDistribution(macros).reduce((sum, { percentage }) => sum + percentage, 0)).toBe(100);
    }
  });

  it('sin calorías (todo en 0) no hay distribución', () => {
    expect(macroDistribution({ carbohydrate: 0, protein: 0, fat: 0 })).toEqual([]);
  });
});
