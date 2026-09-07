import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ConsultationProvider, useConsultation } from './consultation.context';
import type { AnamnesisDto, MeasurementsDto, PersonalInfoDto } from '@/features';

const STORAGE_KEY = 'consulta_context';

const wrapper = ({ children }: { children: ReactNode }) => <ConsultationProvider>{children}</ConsultationProvider>;

const PERSONAL_INFO = { firstName: 'Ana' } as unknown as PersonalInfoDto;
const ANAMNESIS = { goals: null, clinical: null, dietary: null, lifestyle: null } as AnamnesisDto;
const MEASUREMENTS: MeasurementsDto = { weight: 70, height: 170, somatotype: 'MESO' };

describe('useConsultation', () => {
  it('throws when used outside a ConsultationProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useConsultation())).toThrow(
      'useConsultation debe usarse dentro de ConsultationProvider'
    );
    consoleError.mockRestore();
  });

  it('starts unhydrated with all fields null, then hydrates from empty storage', async () => {
    const { result } = renderHook(() => useConsultation(), { wrapper });

    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    expect(result.current.personalInfo).toBeNull();
    expect(result.current.anamnesis).toBeNull();
    expect(result.current.measurements).toBeNull();
    expect(result.current.nutritionPlan).toBeNull();
  });

  it('hydrates from valid localStorage content on mount', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ personalInfo: PERSONAL_INFO, anamnesis: null, measurements: null, nutritionPlan: null }));

    const { result } = renderHook(() => useConsultation(), { wrapper });

    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    expect(result.current.personalInfo).toEqual(PERSONAL_INFO);
  });

  it('falls back to nulls without crashing when localStorage content is corrupted JSON', async () => {
    localStorage.setItem(STORAGE_KEY, '{not-json');

    const { result } = renderHook(() => useConsultation(), { wrapper });

    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    expect(result.current.personalInfo).toBeNull();
  });

  it('setPersonalInfo and setAnamnesis each persist without erasing the other already-set field', async () => {
    const { result } = renderHook(() => useConsultation(), { wrapper });
    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    act(() => result.current.setPersonalInfo(PERSONAL_INFO));
    act(() => result.current.setAnamnesis(ANAMNESIS));

    expect(result.current.personalInfo).toEqual(PERSONAL_INFO);
    expect(result.current.anamnesis).toEqual(ANAMNESIS);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.personalInfo).toEqual(PERSONAL_INFO);
    expect(stored.anamnesis).toEqual(ANAMNESIS);
  });

  it('getCompleteConsultation returns null until personalInfo, anamnesis and measurements are all set', async () => {
    const { result } = renderHook(() => useConsultation(), { wrapper });
    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    expect(result.current.getCompleteConsultation()).toBeNull();

    act(() => result.current.setPersonalInfo(PERSONAL_INFO));
    expect(result.current.getCompleteConsultation()).toBeNull();

    act(() => result.current.setAnamnesis(ANAMNESIS));
    expect(result.current.getCompleteConsultation()).toBeNull();

    act(() => result.current.setMeasurements(MEASUREMENTS));
    expect(result.current.getCompleteConsultation()).toEqual({
      personalInfo: PERSONAL_INFO,
      anamnesis: ANAMNESIS,
      measurements: MEASUREMENTS,
    });
  });

  it('reset clears all four fields and removes the localStorage key entirely', async () => {
    const { result } = renderHook(() => useConsultation(), { wrapper });
    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    act(() => result.current.setPersonalInfo(PERSONAL_INFO));
    act(() => result.current.setMeasurements(MEASUREMENTS));

    act(() => result.current.reset());

    expect(result.current.personalInfo).toBeNull();
    expect(result.current.anamnesis).toBeNull();
    expect(result.current.measurements).toBeNull();
    expect(result.current.nutritionPlan).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('resetPersonalInfo clears only personalInfo, leaving other persisted fields intact', async () => {
    const { result } = renderHook(() => useConsultation(), { wrapper });
    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    act(() => result.current.setPersonalInfo(PERSONAL_INFO));
    act(() => result.current.setMeasurements(MEASUREMENTS));

    act(() => result.current.resetPersonalInfo());

    expect(result.current.personalInfo).toBeNull();
    expect(result.current.measurements).toEqual(MEASUREMENTS);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.personalInfo).toBeNull();
    expect(stored.measurements).toEqual(MEASUREMENTS);
  });
});
