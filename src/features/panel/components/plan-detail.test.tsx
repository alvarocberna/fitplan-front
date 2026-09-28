import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PlanDetail } from './plan-detail.component';
import type { MyPlanDetailDto } from '../dtos/my-plan.dto';

const generatedPlan: MyPlanDetailDto = {
  orderId: 'order-1',
  type: 'GENERATED',
  name: 'Plan personalizado',
  purchasedAt: '2026-02-01T12:00:00.000Z',
  pdfUrl: 'https://signed.example/order-1.pdf',
  thumbnailUrl: 'https://signed.example/order-1.webp',
  predefined: null,
  generated: {
    consultationId: 'c-1',
    planName: 'Plan personalizado',
    period: null,
    startDate: '2026-02-01T00:00:00.000Z',
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
        portions: { cereal: 2, lowFatDairy: 1 },
        examples: ['Pan con quesillo'],
        comments: ['Preferir pan integral'],
        equivalences: ['cereals: avena 1 taza'],
      },
    ],
    supplements: [
      {
        supplement: 'Creatina',
        requirement: 5,
        doseInstructions: '5 gr/día de creatina monohidratada.',
        intakeInstructions: 'Con el desayuno',
        intake: { calories: 0, protein: 0, carbohydrate: 0, fat: 0 },
        effects: ['Mejora la fuerza'],
        considerations: ['Hidratarse bien'],
      },
    ],
    sportsRecommendations: [
      {
        session: 'Pesas',
        strategy: 'Carga de carbohidratos',
        preActivity: 'Plátano',
        duringActivity: null,
        postActivity: 'Batido',
      },
    ],
  },
};

const predefinedPlan: MyPlanDetailDto = {
  orderId: 'order-2',
  type: 'PREDEFINED',
  name: 'Plan Running',
  purchasedAt: '2026-01-01T12:00:00.000Z',
  pdfUrl: 'https://signed.example/order-2.pdf',
  thumbnailUrl: null,
  generated: null,
  predefined: { description: 'Plan para corredores', summary: null },
};

function paragraph(container: HTMLElement, text: string) {
  return within(container).getByText((_, element) => element?.tagName === 'P' && element.textContent === text);
}

describe('PlanDetail', () => {
  it('renders the header with name, type, purchase date, back link, thumbnail and "Descargar plan"', () => {
    render(<PlanDetail plan={generatedPlan} />);

    expect(screen.getByRole('heading', { name: 'Plan personalizado' })).toBeInTheDocument();
    expect(screen.getByText('Personalizado')).toBeInTheDocument();
    expect(screen.getByText('Comprado el 01/02/2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Volver al panel' })).toHaveAttribute('href', '/panel');
    expect(screen.getByAltText('Vista previa de tu plan nutricional')).toHaveAttribute(
      'src',
      'https://signed.example/order-1.webp',
    );
    const download = screen.getByRole('link', { name: 'Descargar plan nutricional' });
    expect(download).toHaveAttribute('href', 'https://signed.example/order-1.pdf');
    expect(download).toHaveTextContent('Descargar plan');
  });

  it('renders the summary and the requirements vs intake table of a personalized plan', () => {
    render(<PlanDetail plan={generatedPlan} />);

    expect(paragraph(document.body, 'Régimen: Hipocalórico')).toBeInTheDocument();
    const caloriesRow = screen.getByRole('row', { name: /Calorías/ });
    expect(within(caloriesRow).getByText('2100 kcal')).toBeInTheDocument();
    expect(within(caloriesRow).getByText('2000 kcal')).toBeInTheDocument();
  });

  it('renders each meal time with its portions and notes', () => {
    render(<PlanDetail plan={generatedPlan} />);

    const breakfast = screen.getByRole('region', { name: 'Desayuno' });
    expect(within(breakfast).getByText('8am')).toBeInTheDocument();
    expect(within(breakfast).getByText('Cereales: 2')).toBeInTheDocument();
    expect(within(breakfast).getByText('Lácteos bajos en grasa: 1')).toBeInTheDocument();
    expect(within(breakfast).getByText('Pan con quesillo')).toBeInTheDocument();
    expect(within(breakfast).getByText('cereals: avena 1 taza')).toBeInTheDocument();
    expect(within(breakfast).getByText('Preferir pan integral')).toBeInTheDocument();
  });

  it('renders supplements and sports recommendations', () => {
    render(<PlanDetail plan={generatedPlan} />);

    const creatine = screen.getByRole('region', { name: 'Creatina' });
    expect(paragraph(creatine, 'Dosis: 5 gr/día de creatina monohidratada.')).toBeInTheDocument();
    expect(within(creatine).getByText('Mejora la fuerza')).toBeInTheDocument();
    expect(within(creatine).getByText('Hidratarse bien')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Pesas' })).toBeInTheDocument();
    expect(paragraph(document.body, 'Antes de la actividad: Plátano')).toBeInTheDocument();
    expect(screen.queryByText(/Durante la actividad/)).not.toBeInTheDocument();
  });

  it('hides the supplements and sports sections when the plan has none', () => {
    render(
      <PlanDetail
        plan={{ ...generatedPlan, generated: { ...generatedPlan.generated!, supplements: [], sportsRecommendations: [] } }}
      />,
    );

    expect(screen.queryByText('Suplementación')).not.toBeInTheDocument();
    expect(screen.queryByText('Recomendaciones deportivas')).not.toBeInTheDocument();
  });

  it('tells the detail is unavailable when a personalized plan has no stored detail', () => {
    render(<PlanDetail plan={{ ...generatedPlan, generated: null }} />);

    expect(
      screen.getByText('El detalle de este plan no está disponible. Puedes descargar el PDF completo.'),
    ).toBeInTheDocument();
  });

  it('renders the description and summary of a standard plan', () => {
    render(<PlanDetail plan={predefinedPlan} />);

    expect(screen.getByText('Estándar')).toBeInTheDocument();
    expect(screen.getByText('Plan para corredores')).toBeInTheDocument();
    expect(paragraph(document.body, 'Régimen: —')).toBeInTheDocument();
    expect(screen.getByText('Vista previa no disponible')).toBeInTheDocument();
    expect(screen.queryByText('Tiempos de comida')).not.toBeInTheDocument();
  });
});
