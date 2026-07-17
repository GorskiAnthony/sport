import { planUsagePercent, UNLIMITED_PLAN_LIMIT } from './plan-usage';

describe('planUsagePercent', () => {
  it('returns null for the unlimited sentinel', () => {
    expect(planUsagePercent(5, UNLIMITED_PLAN_LIMIT)).toBeNull();
  });

  it('guards against a zero/negative max instead of dividing by zero', () => {
    expect(planUsagePercent(0, 0)).toBe(0);
    expect(planUsagePercent(3, -1)).toBe(0);
  });

  it('computes a normal percentage', () => {
    expect(planUsagePercent(1, 4)).toBe(25);
  });

  it('rounds to the nearest whole percent', () => {
    expect(planUsagePercent(1, 3)).toBe(33);
  });

  it('clamps at 100% when used exceeds max', () => {
    expect(planUsagePercent(10, 4)).toBe(100);
  });

  it('returns 0% when nothing has been used', () => {
    expect(planUsagePercent(0, 5)).toBe(0);
  });
});
