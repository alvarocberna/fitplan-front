import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { ComponentType } from 'react';
import { MacroDistributionCard } from './macro-distribution-card.component';

// nivo necesita medidas reales del DOM: stub que lista cada porción (id:valor:color) y dibuja las capas
// custom con un centro fijo, para comprobar el texto del centro de la dona.
vi.mock('@nivo/pie', () => ({
  ResponsivePie: ({
    data,
    colors,
    layers = [],
  }: {
    data: { id: string; value: number; color: string }[];
    colors: (arg: { data: { color: string } }) => string;
    layers?: (string | ComponentType<{ centerX: number; centerY: number }>)[];
  }) => (
    <div>
      <ul data-testid="pie-stub">
        {data.map((slice) => (
          <li key={slice.id}>{`${slice.id}:${slice.value}:${colors({ data: slice })}`}</li>
        ))}
      </ul>
      <svg data-testid="pie-layers">
        {layers
          .filter((layer): layer is ComponentType<{ centerX: number; centerY: number }> => typeof layer !== 'string')
          .map((Layer, index) => (
            <Layer key={index} centerX={100} centerY={100} />
          ))}
      </svg>
    </div>
  ),
}));

const macros = { calories: 2000, carbohydrate: 200, protein: 150, fat: 60 };

describe('MacroDistributionCard', () => {
  it('shows the default title, or a custom one', () => {
    const { rerender } = render(<MacroDistributionCard macros={macros} />);
    expect(screen.getByRole('heading', { name: 'Distribución de macronutrientes' })).toBeInTheDocument();

    rerender(<MacroDistributionCard macros={macros} title="Macros del plan" />);
    expect(screen.getByRole('heading', { name: 'Macros del plan' })).toBeInTheDocument();
  });

  it('draws one slice per macronutrient with its % of calories and its color (carbs green, protein purple, fat yellow)', () => {
    render(<MacroDistributionCard macros={macros} />);

    expect(within(screen.getByTestId('pie-stub')).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'carbohydrate:41:#16a34a',
      'protein:31:#9333ea',
      'fat:28:#eab308',
    ]);
  });

  it('puts "Total" and the calories in the middle of the donut', () => {
    render(<MacroDistributionCard macros={macros} />);

    const center = screen.getByTestId('pie-layers');
    expect(within(center).getByText('Total')).toBeInTheDocument();
    expect(within(center).getByText('2000 kcal')).toBeInTheDocument();
  });

  it('lists each macronutrient on the right with its % and, below it, the grams', () => {
    render(<MacroDistributionCard macros={macros} />);

    const legend = screen.getAllByRole('list').find((list) => list.dataset.testid !== 'pie-stub') as HTMLElement;
    expect(within(legend).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Carbohidratos41 %200 g',
      'Proteínas31 %150 g',
      'Lípidos28 %60 g',
    ]);
    // % y gramos en elementos separados, los gramos después (debajo)
    const percentage = within(legend).getByText('41 %');
    expect(percentage.nextElementSibling?.textContent).toBe('200 g');
    expect(screen.getByRole('img', { name: /Carbohidratos 41 % \(200 g\).*Total 2000 kcal/ })).toBeInTheDocument();
  });

  it('shows a message instead of the chart when there are no macronutrients', () => {
    render(<MacroDistributionCard macros={{ calories: 0, carbohydrate: 0, protein: 0, fat: 0 }} />);

    expect(screen.getByText('Sin información de macronutrientes')).toBeInTheDocument();
    expect(screen.queryByTestId('macro-distribution-chart')).not.toBeInTheDocument();
  });
});
