import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PanelService } from './panel.service';
import { getPanelSummaryAction } from './panel.actions';

vi.mock('./panel.actions', () => ({
  getPanelSummaryAction: vi.fn(),
}));

const mockedGetPanelSummaryAction = vi.mocked(getPanelSummaryAction);

const summary = {
  firstName: 'Ana',
  middleName: null,
  paternalLastName: 'Pérez',
  maternalLastName: null,
  age: 34,
  lastConsultationDate: null,
  goal: 'Bajar de peso',
  nutritionalPlan: null,
};

beforeEach(() => {
  mockedGetPanelSummaryAction.mockReset();
});

describe('PanelService', () => {
  it('getSummary returns the unwrapped summary on success', async () => {
    mockedGetPanelSummaryAction.mockResolvedValue({ ok: true, data: summary });

    const result = await PanelService.getSummary();

    expect(mockedGetPanelSummaryAction).toHaveBeenCalledWith();
    expect(result).toEqual(summary);
  });

  it('getSummary throws with the backend message when the action fails', async () => {
    mockedGetPanelSummaryAction.mockResolvedValue({ ok: false, message: 'No se pudo obtener el resumen' });

    await expect(PanelService.getSummary()).rejects.toThrow('No se pudo obtener el resumen');
  });
});
