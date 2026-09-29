import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PlanOverviewCard, planMacrosOf } from './plan-overview-card.component';
import type { MyPlanDetailDto } from '../dtos/my-plan.dto';

const generatedPlan: MyPlanDetailDto = {
  orderId: 'order-1',
  type: 'GENERATED',
  name: 'Plan personalizado',
  purchasedAt: '2026-09-27T12:00:00.000Z',
  pdfUrl: 'https://signed.example/order-1.pdf',
  thumbnailUrl: null,
  predefined: null,
  generated: {
    consultationId: 'c-1',
    planName: 'Plan personalizado',
    period: null,
    startDate: '2026-09-27T00:00:00.000Z',
    endDate: '2026-12-27T00:00:00.000Z',
    goal: 'definicion',
    dietRegimen: 'Hipocalórico',
    requirements: { calories: 2100, protein: 160, carbohydrate: 210, fat: 65 },
    intake: { calories: 2000, protein: 150, carbohydrate: 200, fat: 60 },
    mealTimes: [],
    supplements: [],
    sportsRecommendations: [],
  },
};

const standardPlan: MyPlanDetailDto = {
  ...generatedPlan,
  orderId: 'order-2',
  type: 'PREDEFINED',
  generated: null,
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
};

// Valores (<dd>) del dato con esa etiqueta; con ícono, la etiqueta va en un <span> dentro del <dt>.
function stat(label: string): string {
  const card = screen.getByRole('region', { name: 'Datos del plan' });
  const term = within(card).getByText((_, element) => element?.tagName === 'DT' && element.textContent === label);
  return within(term.parentElement as HTMLElement)
    .getAllByRole('definition')
    .map((dd) => dd.textContent)
    .join(' | ');
}

describe('PlanOverviewCard', () => {
  it('shows goal, regimen, duration and the four macronutrients of a personalized plan', () => {
    render(<PlanOverviewCard plan={generatedPlan} />);

    expect(stat('Objetivo')).toBe('definicion');
    expect(stat('Régimen')).toBe('Hipocalórico');
    expect(stat('Duración')).toBe('3 meses | 27/09/2026 – 27/12/2026');
    expect(stat('Calorías')).toBe('2000 | kcal');
    expect(stat('Lípidos')).toBe('60 | g');
  });

  it('takes the data of a standard plan from its product summary, without duration', () => {
    render(<PlanOverviewCard plan={standardPlan} />);

    expect(stat('Objetivo')).toBe('Rendimiento');
    expect(stat('Duración')).toBe('—');
    expect(stat('Carbohidratos')).toBe('330 | g');
  });

  it('shows "—" everywhere without a plan', () => {
    render(<PlanOverviewCard plan={null} />);

    for (const label of ['Objetivo', 'Régimen', 'Duración', 'Calorías', 'Proteínas', 'Carbohidratos', 'Lípidos']) {
      expect(stat(label)).toBe('—');
    }
  });

  it('shows an inner title only when one is given (/inicio yes, plan detail no)', () => {
    const { rerender } = render(<PlanOverviewCard plan={generatedPlan} />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();

    rerender(<PlanOverviewCard plan={generatedPlan} title="Información plan" />);
    expect(screen.getByRole('heading', { name: 'Información plan' })).toBeInTheDocument();
  });
});

describe('planMacrosOf', () => {
  it('uses the intake of a personalized plan', () => {
    expect(planMacrosOf(generatedPlan)).toEqual({ calories: 2000, protein: 150, carbohydrate: 200, fat: 60 });
  });

  it('maps the summary of a standard plan', () => {
    expect(planMacrosOf(standardPlan)).toEqual({ calories: 2400, protein: 120, carbohydrate: 330, fat: 70 });
  });

  it('is null without a plan or without complete data', () => {
    expect(planMacrosOf(null)).toBeNull();
    expect(planMacrosOf({ ...standardPlan, predefined: { description: 'x', summary: null } })).toBeNull();
  });
});
