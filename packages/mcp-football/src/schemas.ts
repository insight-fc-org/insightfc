import { z } from 'zod';

export const FixturesGet = z.object({
  leagueId: z.number().int().positive(),
  limit: z.number().int().positive().max(200).default(1)
});

export type FixturesGetInput = z.infer<typeof FixturesGet>;