import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PanelService } from './panel.service';
import { getPanelSummaryAction } from './panel.actions';

vi.mock('./panel.actions', () => ({
  getPanelSummaryAction: vi.fn(),
}));

const mockedGetPanelSummaryAction = vi.mocked(getPanelSummaryAction);

beforeEach(() => {
  mockedGetPanelSummaryAction.mockReset();
});

describe('PanelService', () => {
  it('getSummary returns the unwrapped summary on success', async () => {
    mockedGetPanelSummaryAction.mockResolvedValue({
      ok: true,
      data: { firstName: 'Ana', paternalLastName: 'Pérez', age: 34, goal: 'Bajar de peso', nutritionalPlan: null },
    });

    const result = await PanelService.getSummary();

    expect(mockedGetPanelSummaryAction).toHaveBeenCalledWith();
    expect(result).toEqual({ firstName: 'Ana', paternalLastName: 'Pérez', age: 34, goal: 'Bajar de peso', nutritionalPlan: null });
  });

  it('getSummary throws with the backend message when the action fails', async () => {
    mockedGetPanelSummaryAction.mockResolvedValue({ ok: false, message: 'No se pudo obtener el resumen' });

    await expect(PanelService.getSummary()).rejects.toThrow('No se pudo obtener el resumen');
  });
});
