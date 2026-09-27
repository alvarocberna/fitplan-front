import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ConsultationDetail } from './consultation-detail.component';
import type { ConsultationDetailDto } from '../dtos/consultation-detail.dto';

const detail: ConsultationDetailDto = {
  consultationId: 'c-1',
  consultationNumber: 1,
  consultationDate: '2026-03-15T12:00:00.000Z',
  goals: { mainGoal: 'Bajar de peso', secondaryGoals: ['Dormir mejor', 'Más energía'] },
  planStatus: 'ready',
  orderId: 'order-1',
  measurements: [
    {
      measurementId: 'm-1',
      measurementNumber: 1,
      measuredAt: '2026-03-15T12:00:00.000Z',
      level: 'BASIC',
      basic: { weight: 70.5, height: 172, sittingHeight: null, armSpan: null },
      results: { bmi: 23.83, bmiClassification: 'NORMAL_WEIGHT', bfPercentage: null, bfClassification: null },
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

// Valor (<dd>) de la fila `label` dentro de un <dl>.
function rowValue(container: HTMLElement, label: string): string | null {
  const row = within(container).getByText(label, { selector: 'dt' }).parentElement as HTMLElement;
  return within(row).getByRole('definition').textContent;
}

describe('ConsultationDetail', () => {
  it('renders the header with number, date and a link back to the panel, without a tag when the plan is ready', () => {
    render(<ConsultationDetail consultation={detail} />);

    const heading = screen.getByRole('heading', { name: 'Consulta N°1' });
    const header = heading.parentElement!.parentElement as HTMLElement;
    expect(within(header).getByText('15/03/2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Volver al panel' })).toHaveAttribute('href', '/panel');
    expect(screen.queryByText(/Por pagar|Generando|^Error$/)).not.toBeInTheDocument();
  });

  it('renders main and secondary goals', () => {
    render(<ConsultationDetail consultation={detail} />);

    expect(screen.getByText('Bajar de peso')).toBeInTheDocument();
    expect(screen.getByText('Dormir mejor')).toBeInTheDocument();
    expect(screen.getByText('Más energía')).toBeInTheDocument();
  });

  it('renders the measurements taken in the consultation, only with the fields it has', () => {
    render(<ConsultationDetail consultation={detail} />);

    const measurement = screen.getByLabelText('Medición N°1');
    expect(rowValue(measurement, 'Nivel')).toBe('Básica');
    expect(rowValue(measurement, 'Peso')).toBe('70.5 kg');
    expect(rowValue(measurement, 'Talla')).toBe('172 cm');
    expect(rowValue(measurement, 'IMC')).toBe('23.8 (Normal)');
    expect(rowValue(measurement, '% grasa')).toBe('—');
    expect(within(measurement).queryByText('Talla sentado')).not.toBeInTheDocument();
    expect(within(measurement).queryByText('Envergadura')).not.toBeInTheDocument();
  });

  it('renders the plan summary with a button to download the plan PDF', () => {
    render(<ConsultationDetail consultation={detail} />);

    expect(screen.getByText('Plan personalizado')).toBeInTheDocument();
    expect(screen.getByText('Hipocalórico')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' &&
          element.textContent === 'Calorías: 2000 kcal · Proteínas: 150 g · Carbohidratos: 200 g · Lípidos: 60 g',
      ),
    ).toBeInTheDocument();
    const download = screen.getByRole('link', { name: 'Descargar plan' });
    expect(download).toHaveAttribute('href', 'https://signed.example/order-1.pdf');
    expect(download).toHaveAttribute('download');
    expect(screen.queryByRole('link', { name: 'Ver plan completo' })).not.toBeInTheDocument();
  });

  it('tells the PDF is not available yet when the plan has no signed URL', () => {
    render(<ConsultationDetail consultation={{ ...detail, plan: { ...detail.plan!, pdfUrl: null } }} />);

    expect(screen.queryByRole('link', { name: 'Descargar plan' })).not.toBeInTheDocument();
    expect(screen.getByText('El PDF del plan todavía no está disponible.')).toBeInTheDocument();
  });

  it('shows empty states when there are no goals nor measurements', () => {
    render(
      <ConsultationDetail
        consultation={{ ...detail, goals: { mainGoal: null, secondaryGoals: [] }, measurements: [] }}
      />,
    );

    expect(screen.getByText('Sin objetivos registrados.')).toBeInTheDocument();
    expect(screen.getByText('No se registraron mediciones en esta consulta.')).toBeInTheDocument();
  });

  it('offers to pay an unpaid consultation', () => {
    render(<ConsultationDetail consultation={{ ...detail, planStatus: 'awaiting_payment', plan: null }} />);

    expect(screen.getByText('Por pagar')).toBeInTheDocument();
    expect(screen.getByText('Aún no has pagado esta consulta.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pagar consulta' })).toHaveAttribute('href', '/pago/order-1');
  });

  it.each([
    ['generating', 'Generando', 'Tu plan se está generando.'],
    ['error', 'Error', 'Hubo un error al generar tu plan.'],
  ] as const)('shows the %s state with a link to the plan status', (planStatus, tag, message) => {
    render(<ConsultationDetail consultation={{ ...detail, planStatus, plan: null }} />);

    expect(screen.getByText(tag)).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver estado del plan' })).toHaveAttribute('href', '/ordenes/order-1');
  });

  it('has no edit actions', () => {
    render(<ConsultationDetail consultation={detail} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
