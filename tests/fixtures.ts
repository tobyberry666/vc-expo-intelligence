export function fixtureCache(timestamp = Date.now()) {
  return {
    version: 3,
    timestamp,
    fullSummary: '## 投资情报\n测试情报\n## 展会情报\n测试展会',
    liveInvestments: [
      {
        id: 'live-inv-0',
        company: '星河科技',
        institution: 'IDG资本',
        sector: 'AI',
        round: 'A轮',
        amount: '1亿元',
        date: '2026-07-01',
        summary: '合成测试投资',
        source: 'live' as const,
      },
      {
        id: 'live-inv-1',
        company: '云帆科技',
        institution: '测试基金',
        sector: '芯片',
        round: 'B轮',
        amount: '2亿元',
        date: '未披露',
        summary: '合成未知日期投资',
        source: 'live' as const,
      },
    ],
    liveExpos: [
      {
        id: 'live-expo-0',
        name: 'CES 2026',
        type: 'consumer' as const,
        startDate: '2026-01-06',
        endDate: '2026-01-09',
        location: '测试地点',
        chineseExhibitorCount: 10,
        description: '合成测试展会',
        exhibitors: Array.from({ length: 10 }, (_, i) => `测试企业${i + 1}`),
        source: 'live' as const,
      },
    ],
  };
}
export function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}
