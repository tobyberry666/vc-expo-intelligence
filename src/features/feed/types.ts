import { z } from 'zod';

const field = z.string().max(1000);
export const investmentSchema = z.object({
  id: z.string().min(1).max(16000),
  company: field.min(2),
  institution: field,
  sector: field,
  round: field,
  amount: field,
  date: field,
  summary: z.string().max(4000),
  source: z.literal('live'),
});
export const expoSchema = z.object({
  id: z.string().min(1).max(16000),
  name: field.min(2),
  type: z.enum(['consumer', 'ai', 'auto', 'industrial']),
  startDate: field,
  endDate: field,
  location: field,
  chineseExhibitorCount: z.number().int().nonnegative().max(1000000),
  description: z.string().max(4000),
  exhibitors: z.array(field.min(1)).max(1000),
  source: z.literal('live'),
});
export type LiveInvestmentItem = z.infer<typeof investmentSchema>;
export type LiveExpoItem = z.infer<typeof expoSchema>;
export type FeedPhase = 'idle' | 'searching' | 'extracting' | 'done';
export interface FeedData {
  fullSummary: string;
  liveInvestments: LiveInvestmentItem[];
  liveExpos: LiveExpoItem[];
}
export interface LiveFeedState extends FeedData {
  investmentSummary: string;
  expoSummary: string;
  isLoading: boolean;
  lastUpdate: number | null;
  error: string | null;
  phase: FeedPhase;
  refresh: () => void;
  hasData: boolean;
  resolveItemId: (id: string, type: 'investment' | 'expo') => string;
}
