import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Building2, Calendar, Users, Loader2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import type { LiveInvestmentItem, LiveExpoItem } from '@/hooks/useLiveFeed';

interface StatsCardsSectionProps {
  liveInvestments: LiveInvestmentItem[];
  liveExpos: LiveExpoItem[];
  isLiveLoading: boolean;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function StatsCardsSection({
  liveInvestments,
  liveExpos,
  isLiveLoading,
}: StatsCardsSectionProps) {
  const stats = useMemo(() => {
    const totalInvestments = liveInvestments.length;

    // Count unique institutions from live data
    const institutions = new Set(liveInvestments.map((i) => i.institution));
    const activeInstitutions = institutions.size;

    const totalExpos = liveExpos.length;
    const totalChineseExhibitors = liveExpos.reduce(
      (sum, e) => sum + e.chineseExhibitorCount,
      0
    );

    return [
      {
        label: '投资事件',
        value: totalInvestments,
        suffix: '笔',
        description: '近期追踪到的投融资动态',
        icon: TrendingUp,
        accent: 'text-primary',
        bg: 'bg-primary/10',
        hasLive: true,
      },
      {
        label: '活跃机构',
        value: activeInstitutions,
        suffix: '家',
        description: '近期有投资行为的顶级 PE/VC',
        icon: Building2,
        accent: 'text-chart-2',
        bg: 'bg-chart-2/10',
        hasLive: true,
      },
      {
        label: '科技展会',
        value: totalExpos,
        suffix: '场',
        description: '全球顶级科技与行业展会',
        icon: Calendar,
        accent: 'text-chart-3',
        bg: 'bg-chart-3/10',
        hasLive: true,
      },
      {
        label: '中国参展企业',
        value: totalChineseExhibitors,
        suffix: '家',
        description: '参展的中国科技企业累计',
        icon: Users,
        accent: 'text-chart-4',
        bg: 'bg-chart-4/10',
        hasLive: true,
      },
    ];
  }, [liveInvestments, liveExpos]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="relative overflow-hidden border-border/40 bg-card/60 hover:bg-card/80 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`size-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`size-5 ${stat.accent}`} />
                  </div>
                  {isLiveLoading && stat.hasLive && (
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black tabular-nums tracking-tight text-foreground">
                    {stat.value}
                  </span>
                  <span className="text-sm text-muted-foreground">{stat.suffix}</span>
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">{stat.label}</div>
                <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {stat.description}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
