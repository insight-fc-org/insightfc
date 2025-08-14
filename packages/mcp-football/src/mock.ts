export async function fixturesGet({ leagueId, limit = 1 }: { leagueId: number; limit?: number }) {
  // Pure mock — no external calls. Good for local + CI.
  return {
    items: Array.from({ length: limit }).map((_, i) => ({
      fixture: { id: 1000 + i, date: '2025-01-01T00:00:00Z', status: { short: 'NS' } },
      leagueId,
      teams: { home: { id: 1, name: 'Home' }, away: { id: 2, name: 'Away' } }
    }))
  };
}