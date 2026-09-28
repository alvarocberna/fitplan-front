import { describe, it, expect } from 'vitest';
import {
  bmiScalePercent,
  bodyCompositionBars,
  bodyCompositionPie,
  bodyCompositionRows,
  hasBodyComposition,
  otherItems,
} from './measurement-detail-data';
import type { MeasurementResultDto } from './dtos/measurement.dto';

function result(indicator: string, value: number, unit: string | null = null, method: string | null = null): MeasurementResultDto {
  return { indicator, value, unit, classification: null, method };
}

const bioimpedance: MeasurementResultDto[] = [
  result('BMI', 27.04, 'kg/m²'),
  result('BODY_FAT_PERCENTAGE', 22, '%', 'BIOIMPEDANCE'),
  result('BODY_FAT_KG', 17.6, 'kg', 'BIOIMPEDANCE'),
  result('MUSCLE_MASS_PERCENTAGE', 40, '%', 'BIOIMPEDANCE'),
  result('MUSCLE_MASS_KG', 32, 'kg', 'BIOIMPEDANCE'),
  result('VISCERAL_FAT_PERCENTAGE', 5, '%', 'BIOIMPEDANCE'),
  result('VISCERAL_FAT_KG', 4, 'kg', 'BIOIMPEDANCE'),
  result('BONE_MASS_PERCENTAGE', 4, '%', 'BIOIMPEDANCE'),
  result('BONE_MASS_KG', 3.2, 'kg', 'BIOIMPEDANCE'),
];

describe('bmiScalePercent', () => {
  it('ubica el IMC sobre la escala 15-45 y recorta los extremos', () => {
    expect(bmiScalePercent(15)).toBe(0);
    expect(bmiScalePercent(30)).toBe(50);
    expect(bmiScalePercent(45)).toBe(100);
    expect(bmiScalePercent(12)).toBe(0);
    expect(bmiScalePercent(52)).toBe(100);
  });
});

describe('composición corporal', () => {
  it('las barras traen los kg de los cuatro componentes presentes', () => {
    expect(bodyCompositionBars(bioimpedance).map(({ label, kg }) => [label, kg])).toEqual([
      ['Grasa corporal', 17.6],
      ['Masa muscular', 32],
      ['Grasa visceral', 4],
      ['Masa ósea', 3.2],
    ]);
  });

  it('la torta excluye la grasa visceral y completa el 100 % con "Resto"', () => {
    expect(bodyCompositionPie(bioimpedance).map(({ label, value }) => [label, value])).toEqual([
      ['Grasa corporal', 22],
      ['Masa muscular', 40],
      ['Masa ósea', 4],
      ['Resto', 34],
    ]);
  });

  it('sin "Resto" si los componentes ya suman 100 % o más', () => {
    const slices = bodyCompositionPie([result('BODY_FAT_PERCENTAGE', 45), result('MUSCLE_MASS_PERCENTAGE', 55)]);

    expect(slices.map(({ id }) => id)).toEqual(['bodyFat', 'muscleMass']);
  });

  it('las filas juntan kg, % y método por componente', () => {
    expect(bodyCompositionRows(bioimpedance)[0]).toEqual({
      component: 'bodyFat',
      label: 'Grasa corporal',
      kg: 17.6,
      percentage: 22,
      method: 'BIOIMPEDANCE',
    });
  });

  it('una medición básica (solo IMC) no tiene composición corporal', () => {
    const basic = [result('BMI', 24.3, 'kg/m²')];

    expect(hasBodyComposition(basic)).toBe(false);
    expect(bodyCompositionBars(basic)).toEqual([]);
    expect(bodyCompositionPie(basic)).toEqual([]);
    expect(hasBodyComposition(bioimpedance)).toBe(true);
  });
});

describe('otherItems', () => {
  it('deja fuera peso, talla, IMC y componentes; agrupa el resto con valores', () => {
    const groups = otherItems({
      raw: {
        basic: { weight: 72, height: 172, armSpan: 175 },
        skinfolds: { triceps: 12 },
        circumferences: null,
        diameters: null,
      },
      results: [...bioimpedance, result('ENDOMORPHY', 3.5)],
    });

    expect(groups).toEqual([
      { title: 'Datos básicos', rows: [{ key: 'basic.armSpan', label: 'Envergadura', value: '175 cm' }] },
      { title: 'Pliegues cutáneos', rows: [{ key: 'skinfolds.triceps', label: 'Tríceps', value: '12 mm' }] },
      { title: 'Índices', rows: [{ key: 'ENDOMORPHY', label: 'Endomorfia', value: '3.5' }] },
    ]);
  });

  it('una medición con solo peso y talla no tiene otras mediciones', () => {
    expect(
      otherItems({
        raw: { basic: { weight: 72, height: 172 }, skinfolds: null, circumferences: null, diameters: null },
        results: [result('BMI', 24.3)],
      }),
    ).toEqual([]);
  });
});
