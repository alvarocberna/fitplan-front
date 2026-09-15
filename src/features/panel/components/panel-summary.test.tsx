import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PanelSummary } from './panel-summary.component';
import type { PanelSummaryDto } from '../dtos/panel-summary.dto';

const baseSummary: PanelSummaryDto = {
  firstName: 'Ana',
  paternalLastName: 'Pérez',
  age: 34,
  goal: 'Bajar de peso',
  nutritionalPlan: null,
};

describe('PanelSummary', () => {
  it('renders the user info fields', () => {
    render(<PanelSummary summary={baseSummary} />);

    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('34')).toBeInTheDocument();
    expect(screen.getByText('Bajar de peso')).toBeInTheDocument();
  });

  it('shows placeholders when name, age and goal are missing', () => {
    render(<PanelSummary summary={{ firstName: null, paternalLastName: null, age: null, goal: null, nutritionalPlan: null }} />);

    expect(screen.getByText('Sin datos')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Aún no definido')).toBeInTheDocument();
  });

  it('shows the "no plan yet" message when nutritionalPlan is null', () => {
    render(<PanelSummary summary={baseSummary} />);

    expect(screen.getByText('Todavía no tienes un plan nutricional generado.')).toBeInTheDocument();
    expect(screen.queryByText('Calorías')).not.toBeInTheDocument();
  });

  it('renders the macro breakdown when a nutritionalPlan is present', () => {
    render(
      <PanelSummary
        summary={{
          ...baseSummary,
          nutritionalPlan: { calorieIntake: 2000, proteinIntake: 150, carbohydrateIntake: 200, lipidIntake: 60 },
        }}
      />,
    );

    expect(screen.getByText('2000 kcal')).toBeInTheDocument();
    expect(screen.getByText('150 g')).toBeInTheDocument();
    expect(screen.getByText('200 g')).toBeInTheDocument();
    expect(screen.getByText('60 g')).toBeInTheDocument();
    expect(screen.queryByText('Todavía no tienes un plan nutricional generado.')).not.toBeInTheDocument();
  });
});
