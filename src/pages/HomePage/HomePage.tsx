import { motion } from 'framer-motion';
import { Radar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { useLiveFeed } from '@/hooks/useLiveFeed';
import StatsCardsSection from './sections/StatsCardsSection';
import RecentFeedSection from './sections/RecentFeedSection';
import QuickNavSection from './sections/QuickNavSection';
import AiIntelligenceSection from './sections/AiIntelligenceSection';

export default function HomePage() {
  const {
    fullSummary,
    liveInvestments,
    liveExpos,
    isLoading,
    phase,
    lastUpdate,
    error,
    refresh,
    hasData,
  } = useLiveFeed();

  const today = format(new Date(), 'yyyy 年 M 月 d 日', { locale: zhCN });

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Hero */}
      <section className="w-full py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Radar className="size-6" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                  全球创投与科技展会
                  <span className="text-primary">情报追踪</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  IDG · 红杉中国 · 高瓴 · CES · WAIC 等全球顶级平台动态一站式聚合
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                {isLoading
                  ? phase === 'searching' ? '正在搜索投资情报…'
                  : phase === 'extracting' ? '正在结构化提取…'
                  : '搜索中...'
                  : '实时追踪中'}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-card border border-border/40">
                {today}
              </span>
              {lastUpdate && (
                <span className="px-2.5 py-1 rounded-full bg-card border border-border/40">
                  上次更新: {format(new Date(lastUpdate), 'HH:mm')}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats KPI Cards — with live data counts */}
      <section className="w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <StatsCardsSection
            liveInvestments={liveInvestments}
            liveExpos={liveExpos}
            isLiveLoading={isLoading}
          />
        </div>
      </section>

      {/* AI Real-time Intelligence */}
      <AiIntelligenceSection
        fullSummary={fullSummary}
        isLoading={isLoading}
        lastUpdate={lastUpdate}
        error={error}
        onRefresh={refresh}
        liveInvestmentCount={liveInvestments.length}
        liveExpoCount={liveExpos.length}
      />

      {/* Recent Feed — mock data + live data merged */}
      <RecentFeedSection
        liveInvestments={liveInvestments}
        liveExpos={liveExpos}
        isLiveLoading={isLoading}
        hasLiveData={hasData}
      />

      {/* Quick Nav */}
      <QuickNavSection />
    </div>
  );
}
