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
    endDate: '2026-05-01T00:00:00.000Z',
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

// Valores (<dd>) del dato con esa etiqueta dentro de una card del encabezado.
function stat(cardName: string, label: string): string {
  const card = screen.getByRole('region', { name: cardName });
  // por el contenido completo del <dt>: con ícono, la etiqueta va en un <span> dentro de él
  const term = within(card).getByText((_, element) => element?.tagName === 'DT' && element.textContent === label);
  return within(term.parentElement as HTMLElement)
    .getAllByRole('definition')
    .map((dd) => dd.textContent)
    .join(' | ');
}

function paragraph(container: HTMLElement, text: string) {
  return within(container).getByText((_, element) => element?.tagName === 'P' && element.textContent === text);
}

describe('PlanDetail', () => {
  it('renders the header with name, type, purchase date, back link and the PDF card', () => {
    render(<PlanDetail plan={generatedPlan} />);

    expect(screen.getByRole('heading', { name: 'Plan personalizado' })).toBeInTheDocument();
    expect(screen.getByText('Personalizado')).toBeInTheDocument();
    expect(screen.getByText('Comprado el 01/02/2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Volver a mis planes' })).toHaveAttribute('href', '/planes');
    expect(screen.getByAltText('Vista previa de tu plan nutricional')).toHaveAttribute(
      'src',
      'https://signed.example/order-1.webp',
    );
    const file = screen.getByRole('region', { name: 'Archivo del plan' });
    expect(within(file).getByText('Plan nutricional')).toBeInTheDocument();
    expect(within(file).getByText('PDF')).toBeInTheDocument();
    const download = within(file).getByRole('link', { name: 'Descargar plan nutricional' });
    expect(download).toHaveAttribute('href', 'https://signed.example/order-1.pdf');
    expect(download).toHaveTextContent('Descargar plan');
  });

  it('shows goal, regimen and duration, and the macronutrients of a personalized plan, without a "Resumen" card', () => {
    render(<PlanDetail plan={generatedPlan} />);

    expect(stat('Datos del plan', 'Objetivo')).toBe('definicion');
    expect(stat('Datos del plan', 'Régimen')).toBe('Hipocalórico');
    expect(stat('Datos del plan', 'Duración')).toBe('3 meses | 01/02/2026 – 01/05/2026');
    expect(stat('Datos del plan', 'Calorías')).toBe('2000 | kcal');
    expect(stat('Datos del plan', 'Proteínas')).toBe('150 | g');
    expect(stat('Datos del plan', 'Carbohidratos')).toBe('200 | g');
    expect(stat('Datos del plan', 'Lípidos')).toBe('60 | g');
    expect(screen.queryByText('Resumen')).not.toBeInTheDocument();
    // los macronutrientes van en la misma card que objetivo, régimen y duración, sin título propio
    expect(screen.queryByRole('region', { name: 'Macronutrientes' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Macronutrientes' })).not.toBeInTheDocument();
  });

  it('shows "—" as duration when the plan has no end date', () => {
    render(<PlanDetail plan={{ ...generatedPlan, generated: { ...generatedPlan.generated!, endDate: null } }} />);

    expect(stat('Datos del plan', 'Duración')).toBe('—');
  });

  it('summarizes each meal time with its hour and the portions of the groups that have a value', () => {
    render(<PlanDetail plan={generatedPlan} />);

    expect(screen.getByText('Resumen del plan')).toBeInTheDocument();
    const breakfast = screen.getByRole('listitem', { name: 'Resumen de Desayuno' });
    expect(within(breakfast).getByText('Desayuno')).toBeInTheDocument();
    expect(within(breakfast).getByText('8am')).toBeInTheDocument();
    const portions = within(breakfast)
      .getAllByRole('listitem')
      .map((item) => item.textContent);
    expect(portions).toEqual(['Cereales2', 'Lácteos bajos en grasa1']);
    expect(screen.queryByText('Requerimientos vs ingesta')).not.toBeInTheDocument();
  });

  it('has no plan summary when the plan has no meal times', () => {
    render(<PlanDetail plan={{ ...generatedPlan, generated: { ...generatedPlan.generated!, mealTimes: [] } }} />);

    expect(screen.queryByText('Resumen del plan')).not.toBeInTheDocument();
  });

  it('hides the meal times detail card for now (examples, equivalences and comments are not shown)', () => {
    render(<PlanDetail plan={generatedPlan} />);

    expect(screen.queryByText('Tiempos de comida')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Desayuno' })).not.toBeInTheDocument();
    expect(screen.queryByText('Pan con quesillo')).not.toBeInTheDocument();
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

  it('renders the description of a standard plan and its header data from the product summary', () => {
    render(<PlanDetail plan={predefinedPlan} />);

    expect(screen.getByText('Estándar')).toBeInTheDocument();
    expect(screen.getByText('Plan para corredores')).toBeInTheDocument();
    expect(stat('Datos del plan', 'Régimen')).toBe('—');
    expect(stat('Datos del plan', 'Duración')).toBe('—');
    expect(stat('Datos del plan', 'Calorías')).toBe('—');
    expect(screen.getByText('Vista previa no disponible')).toBeInTheDocument();
    expect(screen.queryByText('Tiempos de comida')).not.toBeInTheDocument();
  });

  it('takes the header data of a standard plan from its summary when it has one', () => {
    render(
      <PlanDetail
        plan={{
          ...predefinedPlan,
          predefined: {
            description: 'Plan para corredores',
            summary: {
              goal: 'Rendimiento',
              dietRegimen: 'Normocalórico',
              calorieIntake: 2400,
              proteinIntake: 120,
              carbohydrateIntake: 330,
              lipidIntake: 70,
            },
          },
        }}
      />,
    );

    expect(stat('Datos del plan', 'Objetivo')).toBe('Rendimiento');
    expect(stat('Datos del plan', 'Carbohidratos')).toBe('330 | g');
  });
});
