import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DownloadPlanPdf } from './download-plan-pdf';
import type { NutritionPlanDto } from '../dtos/nutrition-plan.dto';

let mockLoading = false;

vi.mock('@react-pdf/renderer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-pdf/renderer')>();
  return {
    ...actual,
    PDFDownloadLink: (props: { fileName: string; children: (state: { loading: boolean }) => React.ReactNode }) => (
      <div data-filename={props.fileName}>{props.children({ loading: mockLoading })}</div>
    ),
  };
});

const plan = { personalInfo: { name: 'Ana', lastName: 'Pérez' } } as unknown as NutritionPlanDto;

beforeEach(() => {
  mockLoading = false;
});

describe('DownloadPlanPdf', () => {
  it('shows "Descargar PDF" when not loading', () => {
    render(<DownloadPlanPdf plan={plan} />);
    expect(screen.getByText('Descargar PDF')).toBeInTheDocument();
  });

  it('shows "Preparando PDF..." while loading', () => {
    mockLoading = true;
    render(<DownloadPlanPdf plan={plan} />);
    expect(screen.getByText('Preparando PDF...')).toBeInTheDocument();
  });

  it('builds the filename from the patient first and last name', () => {
    const { container } = render(<DownloadPlanPdf plan={plan} />);
    expect(container.querySelector('[data-filename]')?.getAttribute('data-filename')).toBe('plan-nutricional-Ana-Pérez.pdf');
  });
});
