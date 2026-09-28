import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NutritionalPlanSummary } from './nutritional-plan-summary.component';

function paragraph(text: string) {
  return screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === text);
}

describe('NutritionalPlanSummary', () => {
  it('renders name, goal, regimen and intake', () => {
    render(
      <NutritionalPlanSummary
        planName="Plan personalizado"
        goal="definicion"
        dietRegimen="Hipocalórico"
        intake={{ calorieIntake: 2000, proteinIntake: 150, carbohydrateIntake: 200, lipidIntake: 60 }}
      />,
    );

    expect(paragraph('Plan: Plan personalizado')).toBeInTheDocument();
    expect(paragraph('Objetivo: definicion')).toBeInTheDocument();
    expect(paragraph('Régimen: Hipocalórico')).toBeInTheDocument();
    expect(paragraph('Calorías: 2000 kcal · Proteínas: 150 g · Carbohidratos: 200 g · Lípidos: 60 g')).toBeInTheDocument();
  });

  it('omits the name line when no name is given', () => {
    render(<NutritionalPlanSummary goal="definicion" dietRegimen="Hipocalórico" intake={null} />);

    expect(screen.queryByText('Plan:')).not.toBeInTheDocument();
  });

  it('shows placeholders for missing data, also per macro', () => {
    render(
      <NutritionalPlanSummary
        goal={null}
        dietRegimen={null}
        intake={{ calorieIntake: 2500, proteinIntake: null, carbohydrateIntake: null, lipidIntake: null }}
      />,
    );

    expect(paragraph('Objetivo: —')).toBeInTheDocument();
    expect(paragraph('Régimen: —')).toBeInTheDocument();
    expect(paragraph('Calorías: 2500 kcal · Proteínas: — · Carbohidratos: — · Lípidos: —')).toBeInTheDocument();
  });

  it('shows a single placeholder when there is no intake at all', () => {
    render(<NutritionalPlanSummary goal={null} dietRegimen={null} intake={null} />);

    expect(paragraph('Calorías y macros: —')).toBeInTheDocument();
  });
});
