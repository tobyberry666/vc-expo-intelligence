import { z } from 'zod';
import { investmentSchema, expoSchema } from './types';
import { investmentId, expoId } from './identity';
import type { FeedResult } from './service';

const snapshotSchema = z.object({
  updatedAt: z.number().int().positive(),
  fullSummary: z.string().max(100000),
  liveInvestments: z.array(investmentSchema).min(1).max(100),
  liveExpos: z.array(expoSchema).max(50),
  warning: z.string().max(1000).nullable(),
});

export async function fetchPublicFeed(
  signal: AbortSignal,
): Promise<FeedResult> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/feed.json`, {
    signal,
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('公开数据暂时不可用');
  const text = await response.text();
  if (text.length > 2000000) throw new Error('数据超过大小限制');
  const data = snapshotSchema.parse(JSON.parse(text));
  if (data.updatedAt > Date.now() + 300000) throw new Error('数据时间无效');
  const stale = Date.now() - data.updatedAt > 48 * 3600000;
  return {
    ...data,
    liveInvestments: data.liveInvestments.map((item) => ({
      ...item,
      id: investmentId(item),
    })),
    liveExpos: data.liveExpos.map((item) => ({ ...item, id: expoId(item) })),
    warning: stale ? '数据已超过 48 小时未更新，请核对来源' : data.warning,
  };
}
