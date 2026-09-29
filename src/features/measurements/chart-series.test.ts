import { describe, it, expect } from 'vitest';
import {
  buildChartSeries,
  buildTimeAxis,
  chartTicks,
  latestMetricValues,
  measurementsInPlanRange,
  parseDateOnly,
  yScaleTicks,
} from './chart-series';
import type { MeasurementSummaryDto } from './dtos/measurement.dto';
import type { MyPlanProjectionValuesDto } from '../dashboard/dtos/my-plan.dto';

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

  it('con proyección agrega series meta desde el último valor medido hasta el término del plan', () => {
    const series = buildChartSeries(
      [measurement({ measuredAt: '2026-09-28T12:00:00.000Z', level: 'BIOIMPEDANCE', bfKg: 17.6, mmKg: 32 })],
      projection,
    );

    const weightGoal = series.find(({ id }) => id === 'weight-meta');
    expect(weightGoal?.goal).toBe(true);
    expect(weightGoal?.data.map(({ y }) => y)).toEqual([80, 74]);
    expect(weightGoal?.data[1].date).toEqual(parseDateOnly('2026-12-27'));
    // una sola medición: queda al inicio y la meta (discontinua) ocupa todo el ancho
    expect(weightGoal?.data.map(({ x }) => x)).toEqual([0, 100]);
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

    expect(series.every(({ goal, data }) => goal && data.length === 1)).toBe(true);
  });
});

describe('buildTimeAxis', () => {
  const day = (value: string) => parseDateOnly(value);

  it('con proyección, las mediciones ocupan de 0 a 70 (proporcionales en el tiempo) y la proyección de 70 a 100', () => {
    const toX = buildTimeAxis([day('2026-09-01'), day('2026-09-08'), day('2026-09-15')], day('2026-12-15'));

    expect(toX(day('2026-09-01'))).toBe(0);
    // precisión de enteros: un cambio de horario (DST) en el medio corre la posición unas décimas
    expect(toX(day('2026-09-08'))).toBeCloseTo(35, 0);
    expect(toX(day('2026-09-15'))).toBe(70);
    // la mitad del tramo de proyección cae en la mitad del 30 %
    expect(toX(day('2026-10-30'))).toBeCloseTo(85, 0);
    expect(toX(day('2026-12-15'))).toBe(100);
  });

  it('sin proyección, las mediciones usan todo el ancho', () => {
    const toX = buildTimeAxis([day('2026-09-01'), day('2026-09-15')], null);

    expect(toX(day('2026-09-01'))).toBe(0);
    expect(toX(day('2026-09-15'))).toBe(100);
  });

  it('con una sola fecha medida y proyección, la medición va al inicio y la proyección ocupa todo el ancho', () => {
    const toX = buildTimeAxis([day('2026-09-01')], day('2026-12-01'));

    expect(toX(day('2026-09-01'))).toBe(0);
    // 45 de los 91 días del tramo
    expect(toX(day('2026-10-16'))).toBeCloseTo((45 / 91) * 100, 0);
    expect(toX(day('2026-12-01'))).toBe(100);
  });

  it('con una sola fecha medida y sin proyección, la medición queda al centro', () => {
    expect(buildTimeAxis([day('2026-09-01')], null)(day('2026-09-01'))).toBe(50);
  });

  it('sin mediciones, la proyección queda en el borde derecho', () => {
    expect(buildTimeAxis([], day('2026-12-01'))(day('2026-12-01'))).toBe(100);
  });
});

describe('chartTicks', () => {
  it('marca cada día medido y la fecha proyectada, con su posición', () => {
    const series = buildChartSeries(
      [
        measurement({ measuredAt: '2026-09-01T12:00:00.000Z' }),
        measurement({ measuredAt: '2026-09-15T12:00:00.000Z' }),
      ],
      { ...projection, projectedEndDate: '2026-12-15' },
    );

    expect(chartTicks(series).map(({ x }) => Math.round(x))).toEqual([0, 70, 100]);
  });

  it('con más de 5 días medidos deja 5 marcas repartidas (más la proyectada)', () => {
    const measurements = Array.from({ length: 9 }, (_, index) =>
      measurement({ measuredAt: `2026-09-${String(index + 1).padStart(2, '0')}T12:00:00.000Z` }),
    );
    const ticks = chartTicks(buildChartSeries(measurements, { ...projection, projectedEndDate: '2026-12-15' }));

    expect(ticks).toHaveLength(6);
    expect(ticks[0].x).toBe(0);
    expect(ticks.at(-1)?.x).toBe(100);
  });
});

describe('yScaleTicks', () => {
  const series = (values: number[]) => buildChartSeries(values.map((weight, i) => measurement({ measuredAt: `2026-09-${10 + i}T12:00:00.000Z`, weight, bmi: null })));

  it('redondea la escala a múltiplos de 10 y marca una línea cada 10 unidades', () => {
    expect(yScaleTicks(series([74, 80]))).toEqual({ min: 70, max: 80, ticks: [70, 80] });
    expect(yScaleTicks(series([23.5, 81]))).toEqual({ min: 20, max: 90, ticks: [20, 30, 40, 50, 60, 70, 80, 90] });
  });

  it('amplía un paso si todos los valores caen en el mismo múltiplo, y devuelve null sin datos', () => {
    expect(yScaleTicks(series([80, 80]))).toEqual({ min: 80, max: 90, ticks: [80, 90] });
    expect(yScaleTicks([])).toBeNull();
  });
});

describe('latestMetricValues', () => {
  it('toma el último valor registrado de cada métrica, aunque venga de mediciones distintas', () => {
    const latest = latestMetricValues([
      measurement({ measuredAt: '2026-09-20T12:00:00.000Z', level: 'BIOIMPEDANCE', weight: 82, bmi: 27.7, bfKg: 18, mmKg: 31 }),
      measurement({ measuredAt: '2026-09-28T12:00:00.000Z', weight: 80, bmi: 27.04 }),
    ]);

    expect(latest.map(({ metric, value }) => [metric, value])).toEqual([
      ['weight', 80],
      ['bmi', 27.04],
      ['bfKg', 18],
      ['mmKg', 31],
    ]);
  });

  it('sin mediciones, todos los valores son null', () => {
    expect(latestMetricValues([]).every(({ value }) => value === null)).toBe(true);
  });
});
