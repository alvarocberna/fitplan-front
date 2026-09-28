import { describe, it, expect } from 'vitest';
import { buildChartSeries, measurementsInPlanRange, parseDateOnly } from './chart-series';
import type { MeasurementSummaryDto } from './dtos/measurement.dto';
import type { MyPlanProjectionValuesDto } from '../panel/dtos/my-plan.dto';

// mediodía UTC: el día local es el mismo en cualquier zona horaria razonable
function measurement(overrides: Partial<MeasurementSummaryDto>): MeasurementSummaryDto {
  return {
    measurementId: 'm-x',
    measurementNumber: 1,
    measuredAt: '2026-09-27T12:00:00.000Z',
    level: 'BASIC',
    origin: 'SELF_REPORTED',
    consultationId: null,
    consultationNumber: null,
    weight: 80,
    height: 172,
    bmi: 27.04,
    bmiClassification: 'OVERWEIGHT',
    bfKg: null,
    bfPercentage: null,
    mmKg: null,
    mmPercentage: null,
    ...overrides,
  };
}

const projection: MyPlanProjectionValuesDto = {
  projectedStartDate: '2026-09-27',
  projectedEndDate: '2026-12-27',
  weight: 74,
  bmi: 25.01,
  bfKg: 11.6,
  bfPercentage: 15.68,
  mmKg: 32,
  mmPercentage: 43.24,
};

describe('measurementsInPlanRange', () => {
  const plan = { startDate: '2026-09-27', endDate: '2026-12-27' };

  it('incluye las mediciones del primer y último día del plan y excluye las de fuera', () => {
    const measurements = [
      measurement({ measurementId: 'before', measuredAt: '2026-09-26T12:00:00.000Z' }),
      measurement({ measurementId: 'first-day', measuredAt: '2026-09-27T12:00:00.000Z' }),
      measurement({ measurementId: 'last-day', measuredAt: '2026-12-27T12:00:00.000Z' }),
      measurement({ measurementId: 'after', measuredAt: '2026-12-28T12:00:00.000Z' }),
    ];

    expect(measurementsInPlanRange(measurements, plan).map(({ measurementId }) => measurementId)).toEqual([
      'first-day',
      'last-day',
    ]);
  });
});

describe('buildChartSeries', () => {
  it('ordena por fecha y omite las métricas sin valores (básicas: solo peso e IMC)', () => {
    const series = buildChartSeries([
      measurement({ measuredAt: '2026-09-28T12:00:00.000Z', weight: 78, bmi: 26.37 }),
      measurement({ measuredAt: '2026-09-20T12:00:00.000Z', weight: 80, bmi: 27.04 }),
    ]);

    expect(series.map(({ id }) => id)).toEqual(['weight', 'bmi']);
    expect(series[0].data.map(({ y }) => y)).toEqual([80, 78]);
  });

  it('salta los null sin cortar la línea: grasa y músculo solo con las bioimpedancias', () => {
    const series = buildChartSeries([
      measurement({ measuredAt: '2026-09-20T12:00:00.000Z' }),
      measurement({ measuredAt: '2026-09-28T12:00:00.000Z', level: 'BIOIMPEDANCE', bfKg: 17.6, mmKg: 32 }),
    ]);

    expect(series.find(({ id }) => id === 'weight')?.data).toHaveLength(2);
    expect(series.find(({ id }) => id === 'bfKg')?.data.map(({ y }) => y)).toEqual([17.6]);
    expect(series.find(({ id }) => id === 'mmKg')?.data.map(({ y }) => y)).toEqual([32]);
  });

  it('con proyección agrega series meta punteadas desde el último valor medido hasta el término del plan', () => {
    const series = buildChartSeries(
      [measurement({ measuredAt: '2026-09-28T12:00:00.000Z', level: 'BIOIMPEDANCE', bfKg: 17.6, mmKg: 32 })],
      projection,
    );

    const weightGoal = series.find(({ id }) => id === 'weight-meta');
    expect(weightGoal?.dashed).toBe(true);
    expect(weightGoal?.data.map(({ y }) => y)).toEqual([80, 74]);
    expect(weightGoal?.data[1].x).toEqual(parseDateOnly('2026-12-27'));
    expect(series.find(({ id }) => id === 'bfKg-meta')?.data.map(({ y }) => y)).toEqual([17.6, 11.6]);
    expect(series.find(({ id }) => id === 'mmKg-meta')?.data.map(({ y }) => y)).toEqual([32, 32]);
  });

  it('sin grasa ni músculo proyectados (proyección sobre una básica) solo hay metas de peso e IMC', () => {
    const series = buildChartSeries([measurement({})], {
      ...projection,
      bfKg: null,
      bfPercentage: null,
      mmKg: null,
      mmPercentage: null,
    });

    expect(series.map(({ id }) => id)).toEqual(['weight', 'weight-meta', 'bmi', 'bmi-meta']);
  });

  it('sin mediciones pero con proyección, la meta es un único punto', () => {
    const series = buildChartSeries([], projection);

    expect(series.every(({ dashed, data }) => dashed && data.length === 1)).toBe(true);
  });
});
