import { defaultRouteForRole } from './default-route-for-role';

describe('defaultRouteForRole', () => {
  it('routes organizers to their tournaments', () => {
    expect(defaultRouteForRole('ORGANIZER')).toBe('/tournaments');
  });

  it('falls back to the organizer route for other roles', () => {
    expect(defaultRouteForRole('SPECTATOR')).toBe('/tournaments');
    expect(defaultRouteForRole('ADMIN')).toBe('/tournaments');
  });
});
