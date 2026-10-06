import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { SomatotypeSelector } from './somatotype-selector';
import type { FormMeasurementsInterface } from '@/features';

function Harness({ gender, loading }: { gender?: string | null; loading?: boolean }) {
  const { register } = useForm<FormMeasurementsInterface>();
  return <SomatotypeSelector register={register} gender={gender} loading={loading} />;
}

describe('SomatotypeSelector', () => {
  it('renders skeleton placeholders and no radios while loading', () => {
    render(<Harness loading />);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('renders male images by default when no gender or gender is not FEMENINO', () => {
    render(<Harness loading={false} />);
    const images = screen.getAllByRole('img') as HTMLImageElement[];
    expect(images).toHaveLength(6);
    expect(images.every((img) => img.src.includes('hombre-'))).toBe(true);
  });

  it('renders female images when gender is FEMENINO', () => {
    render(<Harness gender="FEMENINO" loading={false} />);
    const images = screen.getAllByRole('img') as HTMLImageElement[];
    expect(images.every((img) => img.src.includes('mujer-'))).toBe(true);
  });

  it('allows selecting only one somatotype option at a time', async () => {
    const user = userEvent.setup();
    render(<Harness loading={false} />);
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];

    await user.click(radios[0]);
    expect(radios[0].checked).toBe(true);

    await user.click(radios[2]);
    expect(radios[0].checked).toBe(false);
    expect(radios[2].checked).toBe(true);
  });
});
