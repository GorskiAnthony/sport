import { MATCH_STATUS_COLORS, MATCH_STATUS_LABELS } from './match-status';

describe('match-status', () => {
  it('maps every status to the design-system label and color', () => {
    expect(MATCH_STATUS_LABELS.ONGOING).toBe('En cours');
    expect(MATCH_STATUS_COLORS.ONGOING).toBe('primary');
    expect(MATCH_STATUS_LABELS.SCHEDULED).toBe('À venir');
    expect(MATCH_STATUS_COLORS.SCHEDULED).toBe('warning');
    expect(MATCH_STATUS_LABELS.FINISHED).toBe('Terminé');
    expect(MATCH_STATUS_COLORS.FINISHED).toBe('medium');
    expect(MATCH_STATUS_LABELS.FORFEIT).toBe('Forfait');
    expect(MATCH_STATUS_COLORS.FORFEIT).toBe('danger');
  });
});
