import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ConsultationDetail } from './consultation-detail.component';
import type { ConsultationDetailDto } from '../dtos/consultation-detail.dto';
import type { MyPlanDetailDto } from '../dtos/my-plan.dto';
import type { MeasurementDetailDto } from '../../measurements/dtos/measurement.dto';

// PlanFileCard (shared) lee la ruta para decidir si muestra "Ir a inicio" (solo en /ordenes/[id]).
vi.mock('next/navigation', () => ({ usePathname: () => '/inicio/consultas/c-1' }));
// nivo necesita medidas reales del DOM: la dona de macros y los gráficos de la medición se reemplazan por stubs.
vi.mock('@nivo/pie', () => ({ ResponsivePie: () => <div data-testid="pie-stub" /> }));
vi.mock('@nivo/bar', () => ({ ResponsiveBar: () => <div data-testid="bar-stub" /> }));

const consultation: ConsultationDetailDto = {
  consultationId: 'c-1',
  consultationNumber: 1,
  consultationDate: '2026-03-15T12:00:00.000Z',
  goals: { mainGoal: 'Bajar de peso', secondaryGoals: ['Dormir mejor'] },
  planStatus: 'ready',
  orderId: 'order-1',
  measurements: [
    {
      measurementId: 'm-1',
      measurementNumber: 1,
      measuredAt: '2026-03-15T12:00:00.000Z',
      level: 'BASIC',
      basic: { weight: 70.5, height: 172, sittingHeight: null, armSpan: null },
      results: null,
    },
  ],
  plan: {
    orderId: 'order-1',
    pdfUrl: 'https://signed.example/order-1.pdf',
    planName: 'Plan personalizado',
    goal: 'definicion',
    dietRegimen: 'Hipocalórico',
    calorieIntake: 2000,
    proteinIntake: 150,
    carbohydrateIntake: 200,
    lipidIntake: 60,
  },
};

const plan: MyPlanDetailDto = {
  orderId: 'order-1',
  type: 'GENERATED',
  name: 'Plan personalizado',
  purchasedAt: '2026-03-15T12:00:00.000Z',
  pdfUrl: 'https://signed.example/order-1.pdf',
  thumbnailUrl: 'https://signed.example/order-1.webp',
  predefined: null,
  generated: {
    consultationId: 'c-1',
    planName: 'Plan personalizado',
    period: null,
    startDate: null,
    endDate: null,
    goal: 'definicion',
    dietRegimen: 'Hipocalórico',
    requirements: { calories: 2100, protein: 160, carbohydrate: 210, fat: 65 },
    intake: { calories: 2000, protein: 150, carbohydrate: 200, fat: 60 },
    mealTimes: [
      {
        time: 'BREAKFAST',
        hour: '8am',
        intake: { calories: 400, protein: 20, carbohydrate: 50, fat: 10 },
        portions: { cereal: 2 },
        examples: [],
        comments: [],
        equivalences: [],
      },
    ],
    supplements: [
      {
        supplement: 'Creatina',
        requirement: 5,
        doseInstructions: '5 gr/día',
        intakeInstructions: 'Con el desayuno',
        intake: { calories: 0, protein: 0, carbohydrate: 0, fat: 0 },
        effects: [],
        considerations: [],
      },
    ],
    sportsRecommendations: [
      { session: 'Pesas', strategy: 'Carga de carbohidratos', preActivity: null, duringActivity: null, postActivity: null },
    ],
  },
};

const measurement: MeasurementDetailDto = {
  measurementId: 'm-1',
  measurementNumber: 1,
  measuredAt: '2026-03-15T12:00:00.000Z',
  level: 'BASIC',
  origin: 'CONSULTATION',
  consultationId: 'c-1',
  consultationNumber: 1,
  editable: false,
  raw: { basic: { weight: 70.5, height: 172 }, skinfolds: null, circumferences: null, diameters: null },
  results: [{ indicator: 'BMI', value: 23.83, unit: 'kg/m²', classification: 'NORMAL_WEIGHT', method: null }],
};

describe('ConsultationDetail', () => {
  it('renders the header with number, date and a link back to /inicio, without a tag when the plan is ready', () => {
    render(<ConsultationDetail consultation={consultation} plan={plan} measurements={[measurement]} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Consulta N°1' })).toBeInTheDocument();
    expect(screen.getByText('15/03/2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Volver al inicio' })).toHaveAttribute('href', '/inicio');
    expect(screen.queryByText('Por pagar')).not.toBeInTheDocument();
  });

  it('reuses the plan cards: overview, PDF file card and macro distribution', () => {
    render(<ConsultationDetail consultation={consultation} plan={plan} measurements={[]} />);

    const overview = screen.getByRole('region', { name: 'Datos del plan' });
    expect(within(overview).getByText('definicion')).toBeInTheDocument();
    expect(within(overview).getByText('Hipocalórico')).toBeInTheDocument();

    const file = screen.getByRole('region', { name: 'Archivo del plan' });
    expect(within(file).getByAltText('Vista previa de tu plan nutricional')).toHaveAttribute(
      'src',
      'https://signed.example/order-1.webp',
    );
    expect(within(file).getByRole('link', { name: 'Descargar plan nutricional' })).toHaveAttribute(
      'href',
      'https://signed.example/order-1.pdf',
    );
    // "Ir a inicio" solo aparece en /ordenes/[id]
    expect(within(file).queryByRole('link', { name: 'Ir a inicio' })).not.toBeInTheDocument();

    expect(screen.getByRole('region', { name: 'Distribución de macronutrientes' })).toBeInTheDocument();
  });

  it('shows the generated plan sections: meal times, supplements and sports recommendations', () => {
    render(<ConsultationDetail consultation={consultation} plan={plan} measurements={[]} />);

    expect(screen.getByText('Resumen Plan Nutricional')).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Resumen de Desayuno' })).toBeInTheDocument();
    expect(screen.getByText('Suplementación')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Creatina' })).toBeInTheDocument();
    expect(screen.getByText('Recomendaciones deportivas')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pesas' })).toBeInTheDocument();
  });

  it('says the plan detail is not available when the plan has no saved detail', () => {
    render(<ConsultationDetail consultation={consultation} plan={{ ...plan, generated: null }} measurements={[]} />);

    expect(screen.getByText(/El detalle de este plan no está disponible/)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Archivo del plan' })).toBeInTheDocument();
  });

  it('renders each measurement with MeasurementDetail in its compact (embedded) form', () => {
    render(<ConsultationDetail consultation={consultation} plan={plan} measurements={[measurement]} />);

    const measurements = screen.getByRole('region', { name: 'Mediciones' });
    expect(within(measurements).getByRole('heading', { level: 2, name: 'Medición N°1' })).toBeInTheDocument();
    expect(within(measurements).getByRole('link', { name: 'Ver medición' })).toHaveAttribute('href', '/mediciones/m-1');
    expect(within(measurements).getByText('70.5 kg')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '← Volver a mis mediciones' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Editar medición' })).not.toBeInTheDocument();
  });

  it('shows an empty state when the consultation has no measurements', () => {
    render(<ConsultationDetail consultation={consultation} plan={plan} measurements={[]} />);

    expect(screen.getByText('No se registraron mediciones en esta consulta.')).toBeInTheDocument();
  });

  it('offers to pay an unpaid consultation instead of the plan cards', () => {
    render(
      <ConsultationDetail
        consultation={{ ...consultation, planStatus: 'awaiting_payment', plan: null }}
        plan={null}
        measurements={[]}
      />,
    );

    expect(screen.getByText('Aún no has pagado esta consulta.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pagar consulta' })).toHaveAttribute('href', '/pago/order-1');
    expect(screen.queryByRole('region', { name: 'Datos del plan' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Archivo del plan' })).not.toBeInTheDocument();
  });

  it.each([
    ['generating', 'Tu plan se está generando.'],
    ['error', 'Hubo un error al generar tu plan.'],
  ] as const)('with the plan %s, shows its status and links to the order', (planStatus, message) => {
    render(<ConsultationDetail consultation={{ ...consultation, planStatus, plan: null }} plan={null} measurements={[]} />);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver estado del plan' })).toHaveAttribute('href', '/ordenes/order-1');
  });

  it('has no edit actions', () => {
    render(<ConsultationDetail consultation={consultation} plan={plan} measurements={[measurement]} />);

    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /editar/i })).not.toBeInTheDocument();
  });
});
