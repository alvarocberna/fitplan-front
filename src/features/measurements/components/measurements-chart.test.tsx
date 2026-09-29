import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvolutionLines, MeasurementsChart } from './measurements-chart.component';
import type { MeasurementSummaryDto } from '../dtos/measurement.dto';
import type { MyLatestPlanProjectionDto } from '../../dashboard/dtos/my-plan.dto';

// nivo necesita medidas reales del DOM: se reemplaza por un stub que lista cada serie y sus puntos,
// y guarda las últimas props recibidas para revisar la configuración.
const lineProps = vi.hoisted(() => ({ last: {} as Record<string, unknown> }));
vi.mock('@nivo/line', () => ({
  ResponsiveLine: (props: { data: { id: string; data: unknown[] }[] }) => {
    lineProps.last = props;
    return (
      <ul data-testid="series">
        {props.data.map(({ id, data: points }) => (
          <li key={id}>{`${id}:${points.length}`}</li>
        ))}
      </ul>
    );
  },
}));

const base: MeasurementSummaryDto = {
  measurementId: 'm-1',
  measurementNumber: 1,
  measuredAt: '2026-09-20T12:00:00.000Z',
  level: 'BASIC',
  origin: 'CONSULTATION',
  consultationId: 'c-1',
  consultationNumber: 1,
  weight: 80,
  height: 173,
  bmi: 26.73,
  bmiClassification: 'OVERWEIGHT',
  bfKg: null,
  bfPercentage: null,
  mmKg: null,
  mmPercentage: null,
};

const measurements: MeasurementSummaryDto[] = [
  { ...base, measurementId: 'm-3', measurementNumber: 3, measuredAt: '2026-09-28T12:00:00.000Z', level: 'BIOIMPEDANCE', origin: 'SELF_REPORTED', consultationId: null, consultationNumber: null, bfKg: 17.6, mmKg: 32 },
  { ...base, measurementId: 'm-2', measurementNumber: 2, measuredAt: '2026-09-27T12:00:00.000Z', weight: 75 },
  base,
];

const latestPlan: MyLatestPlanProjectionDto = {
  orderId: 'order-1',
  planName: 'Plan personalizado',
  startDate: '2026-09-27',
  endDate: '2026-12-27',
  projection: {
    projectedStartDate: '2026-09-27',
    projectedEndDate: '2026-12-27',
    weight: 74,
    bmi: 25.01,
    bfKg: 11.6,
    bfPercentage: 15.68,
    mmKg: 32,
    mmPercentage: 43.24,
  },
};

function seriesItems() {
  return screen.getAllByRole('listitem').filter((item) => item.closest('[data-testid="series"]'));
}

function seriesText() {
  return seriesItems().map((item) => item.textContent);
}

describe('MeasurementsChart', () => {
  it('con plan abre en "Plan actual": solo las mediciones del período más las metas de la proyección', () => {
    render(<MeasurementsChart measurements={measurements} latestPlan={latestPlan} />);

    expect(screen.getByRole('button', { name: 'Plan actual' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Plan personalizado/)).toBeInTheDocument();
    // m-1 (20-09) queda fuera del período 27-09 → 27-12
    expect(seriesText()).toEqual([
      'weight:2',
      'weight-meta:2',
      'bmi:2',
      'bmi-meta:2',
      'bfKg:1',
      'bfKg-meta:2',
      'mmKg:1',
      'mmKg-meta:2',
    ]);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('sin plan, "Plan actual" está deshabilitado y abre con todas las mediciones', () => {
    render(<MeasurementsChart measurements={measurements} latestPlan={null} />);

    expect(screen.getByRole('button', { name: 'Plan actual' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Todas las mediciones' })).toHaveAttribute('aria-pressed', 'true');
    expect(seriesText()).toEqual(['weight:3', 'bmi:3', 'bfKg:1', 'mmKg:1']);
  });

  it('en "Todas", desmarcar una medición la quita del gráfico y volver a marcarla la repone', async () => {
    const user = userEvent.setup();
    render(<MeasurementsChart measurements={measurements} latestPlan={latestPlan} />);

    await user.click(screen.getByRole('button', { name: 'Todas las mediciones' }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(seriesText()).toEqual(['weight:3', 'bmi:3', 'bfKg:1', 'mmKg:1']);

    await user.click(screen.getByRole('checkbox', { name: 'Incluir medición N°3' }));
    expect(seriesText()).toEqual(['weight:2', 'bmi:2']);

    await user.click(screen.getByRole('checkbox', { name: 'Incluir medición N°3' }));
    expect(seriesText()).toEqual(['weight:3', 'bmi:3', 'bfKg:1', 'mmKg:1']);
  });

  it('muestra un mensaje en lugar del gráfico si no queda ninguna medición marcada', async () => {
    const user = userEvent.setup();
    render(<MeasurementsChart measurements={[base]} latestPlan={null} />);

    await user.click(screen.getByRole('checkbox', { name: 'Incluir medición N°1' }));

    expect(screen.queryByTestId('measurements-chart')).not.toBeInTheDocument();
    expect(screen.getByText('Selecciona al menos una medición.')).toBeInTheDocument();
  });

  it('sin mediciones ni plan muestra el mensaje de historial vacío', () => {
    render(<MeasurementsChart measurements={[]} latestPlan={null} />);

    expect(screen.getByText('Todavía no tienes mediciones para graficar.')).toBeInTheDocument();
  });

  it('marca cada medición con un punto relleno del color de su serie', () => {
    render(<MeasurementsChart measurements={measurements} latestPlan={null} />);

    // en nivo 0.99 el relleno se resuelve con { series, point }: 'series.color' es su clave válida
    expect(lineProps.last.pointColor).toEqual({ from: 'series.color' });
    expect(lineProps.last.pointSize).toBeGreaterThan(0);
    expect(lineProps.last.layers).toContain('points');
  });

  it('en "Plan actual" muestra el rango del plan con un ícono de calendario en vez del nombre visible', () => {
    render(<MeasurementsChart measurements={measurements} latestPlan={latestPlan} />);

    const range = screen.getByText('27/09/2026 al 27/12/2026');
    // el nombre del plan solo queda para lectores de pantalla
    expect(range.parentElement?.querySelector('.sr-only')?.textContent).toBe('Período del plan Plan personalizado:');
    expect(range.parentElement?.querySelector('svg')).not.toBeNull();
  });

  it('eje X por tramos: en "Plan actual" las mediciones van de 0 a 70 y la proyección llega a 100', () => {
    render(<MeasurementsChart measurements={measurements} latestPlan={latestPlan} />);

    expect(lineProps.last.xScale).toEqual({ type: 'linear', min: 0, max: 100 });
    const axis = lineProps.last.axisBottom as { tickValues: number[]; format: (x: number) => string };
    // mediciones del 27-09 y 28-09 y proyección al 27-12
    expect(axis.tickValues).toEqual([0, 70, 100]);
    expect(axis.tickValues.map((x) => axis.format(x))).toEqual(['27/09', '28/09', '27/12']);
    expect(screen.getByText('Proyección')).toBeInTheDocument();
  });

  it('sin proyección ("Todas las mediciones") las mediciones usan todo el ancho y no hay entrada "Proyección"', () => {
    render(<MeasurementsChart measurements={measurements} latestPlan={null} />);

    expect((lineProps.last.axisBottom as { tickValues: number[] }).tickValues).toEqual([0, 87.5, 100]);
    expect(screen.queryByText('Proyección')).not.toBeInTheDocument();
  });

  it('traza las series meta (proyección) con línea discontinua y las medidas con línea continua', () => {
    const position = (x: number) => ({ position: { x, y: 10 } });
    const props = {
      series: [
        { id: 'weight', color: '#111', goal: false, data: [position(0), position(70)] },
        { id: 'weight-meta', color: '#111', goal: true, data: [position(70), position(100)] },
      ],
      lineGenerator: (points: { x: number; y: number }[]) => points.map(({ x, y }) => `${x},${y}`).join(' '),
      lineWidth: 2,
    } as unknown as Parameters<typeof EvolutionLines>[0];
    const { container } = render(
      <svg>
        <EvolutionLines {...props} />
      </svg>,
    );

    expect(container.querySelector('[data-series="weight"]')).not.toHaveAttribute('stroke-dasharray');
    expect(container.querySelector('[data-series="weight-meta"]')).toHaveAttribute('stroke-dasharray', '6 4');
  });

  it('dibuja una línea horizontal cada 10 unidades, con la escala redondeada a esos múltiplos', () => {
    render(<MeasurementsChart measurements={measurements} latestPlan={null} />);

    // valores entre 17.6 (grasa) y 80 (peso): escala 10-80
    expect(lineProps.last.gridYValues).toEqual([10, 20, 30, 40, 50, 60, 70, 80]);
    expect(lineProps.last.yScale).toMatchObject({ min: 10, max: 80 });
    expect((lineProps.last.axisLeft as { tickValues: number[] }).tickValues).toEqual([10, 20, 30, 40, 50, 60, 70, 80]);
  });

  it('"Resumen actual" muestra el último valor de peso, IMC, grasa y masa muscular', () => {
    render(<MeasurementsChart measurements={measurements} latestPlan={null} />);

    const summary = screen.getByRole('region', { name: 'Resumen actual' });
    const rows = within(summary)
      .getAllByRole('term')
      .map((term) => `${term.textContent}: ${term.nextElementSibling?.textContent}`);
    expect(rows).toEqual(['Peso: 80 kg', 'IMC: 26.73', 'Grasa corporal: 17.6 kg', 'Masa muscular: 32 kg']);
  });

  it('shows the inner title only when one is given (/inicio yes, /mediciones no)', () => {
    const { rerender } = render(<MeasurementsChart measurements={measurements} latestPlan={null} />);
    expect(screen.queryByRole('heading', { name: 'Evolución' })).not.toBeInTheDocument();

    rerender(<MeasurementsChart measurements={measurements} latestPlan={null} title="Evolución" />);
    expect(screen.getByRole('heading', { name: 'Evolución' })).toBeInTheDocument();
  });
});
