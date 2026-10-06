import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { PlanSelectionProvider, usePlanSelection } from './plan-selection.context';
import { EMPTY_PLAN_SELECTION } from '../data/plan-code';

const STORAGE_KEY = 'plan_selection';

const wrapper = ({ children }: { children: ReactNode }) => <PlanSelectionProvider>{children}</PlanSelectionProvider>;

describe('usePlanSelection', () => {
  it('lanza un error si se usa fuera de un PlanSelectionProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => usePlanSelection())).toThrow(
      'usePlanSelection debe usarse dentro de PlanSelectionProvider'
    );
    consoleError.mockRestore();
  });

  it('parte sin hidratar y con todo vacío, y luego se hidrata desde un storage vacío', async () => {
    const { result } = renderHook(() => usePlanSelection(), { wrapper });

    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    expect(result.current.selection).toEqual(EMPTY_PLAN_SELECTION);
    expect(result.current.cartItem).toBeNull();
    expect(result.current.selectionModalSlug).toBeNull();
  });

  it('se hidrata desde localStorage al montar', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selection: { weightRange: '50-60', heightCm: '175', sex: 'm', ageRange: '18-30' },
        cartItem: { planSlug: 'plan-gimnasio-volumen', code: 'plan-gimnasio-volumen-50-60-m-joven' },
      })
    );

    const { result } = renderHook(() => usePlanSelection(), { wrapper });

    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    expect(result.current.selection.weightRange).toBe('50-60');
    expect(result.current.cartItem).toEqual({ planSlug: 'plan-gimnasio-volumen', code: 'plan-gimnasio-volumen-50-60-m-joven' });
  });

  it('cae a vacío sin romper si el contenido de localStorage es JSON corrupto', async () => {
    localStorage.setItem(STORAGE_KEY, '{not-json');

    const { result } = renderHook(() => usePlanSelection(), { wrapper });

    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    expect(result.current.selection).toEqual(EMPTY_PLAN_SELECTION);
    expect(result.current.cartItem).toBeNull();
  });

  it('setSelectionField actualiza un campo, conserva los demás y persiste en localStorage', async () => {
    const { result } = renderHook(() => usePlanSelection(), { wrapper });
    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    act(() => result.current.setSelectionField('weightRange', '70-80'));
    act(() => result.current.setSelectionField('sex', 'f'));

    expect(result.current.selection).toEqual({ ...EMPTY_PLAN_SELECTION, weightRange: '70-80', sex: 'f' });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).selection).toEqual(result.current.selection);
  });

  it('dos setSelectionField seguidos en el mismo tick no se pisan entre sí', async () => {
    const { result } = renderHook(() => usePlanSelection(), { wrapper });
    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    act(() => {
      result.current.setSelectionField('weightRange', '40-50');
      result.current.setSelectionField('ageRange', '60+');
    });

    expect(result.current.selection.weightRange).toBe('40-50');
    expect(result.current.selection.ageRange).toBe('60+');
  });

  it('addToCart reemplaza el plan anterior (un solo plan por compra) y clearCart lo vacía, sin tocar la selección', async () => {
    const { result } = renderHook(() => usePlanSelection(), { wrapper });
    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    act(() => result.current.setSelectionField('sex', 'm'));

    act(() => result.current.addToCart({ planSlug: 'plan-gimnasio-volumen', code: 'plan-gimnasio-volumen-50-60-m-joven' }));
    act(() => result.current.addToCart({ planSlug: 'plan-running', code: 'plan-running-50-60-m-joven' }));
    expect(result.current.cartItem).toEqual({ planSlug: 'plan-running', code: 'plan-running-50-60-m-joven' });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).cartItem.planSlug).toBe('plan-running');

    act(() => result.current.clearCart());
    expect(result.current.cartItem).toBeNull();
    expect(result.current.selection.sex).toBe('m');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).cartItem).toBeNull();
  });

  it('openSelectionModal / closeSelectionModal controlan el plan del modal (sin persistirlo)', async () => {
    const { result } = renderHook(() => usePlanSelection(), { wrapper });
    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    act(() => result.current.openSelectionModal('plan-gimnasio-definicion'));
    expect(result.current.selectionModalSlug).toBe('plan-gimnasio-definicion');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    act(() => result.current.closeSelectionModal());
    expect(result.current.selectionModalSlug).toBeNull();
  });
});
