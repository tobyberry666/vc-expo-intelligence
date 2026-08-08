import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderTree, Clock, SlidersHorizontal, TrendingUp, Brain, Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { useLiveFeed } from '@/hooks/useLiveFeed';
import LiveIndicator from '@/components/LiveIndicator';

import InvestmentFilterAside from './sections/InvestmentFilterAside';
import InvestmentTreeSection from './sections/InvestmentTreeSection';
import InvestmentTimelineSection from './sections/InvestmentTimelineSection';

type ViewMode = 'tree' | 'timeline';

export default function InvestmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { favorites, isFavorited, toggleFavorite } = useFavorites();
  const { investmentSummary, liveInvestments, isLoading: isLiveLoading, phase, lastUpdate, error, refresh, hasData } = useLiveFeed();
  const [showAiPanel, setShowAiPanel] = useState(true);

  // All data comes from AI live search
  const allInvestments = useMemo(() => {
    return liveInvestments.map((li) => ({
      ...li,
      id: li.id,
      imageUrl: '',
      source: 'live' as const,
    }));
  }, [liveInvestments]);

  // Derive available filter options from merged data
  const allInstitutions = useMemo(
    () => [...new Set(allInvestments.map((i) => i.institution))],
    [allInvestments]
  );
  const allSectors = useMemo(
    () => [...new Set(allInvestments.map((i) => i.sector))],
    [allInvestments]
  );

  // Filter state synced with URL search params
  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>(() => {
    const param = searchParams.get('institutions');
    return param ? param.split(',').filter(Boolean) : [];
  });
  const [selectedSectors, setSelectedSectors] = useState<string[]>(() => {
    const param = searchParams.get('sectors');
    return param ? param.split(',').filter(Boolean) : [];
  });
  const [keyword, setKeyword] = useState(() => searchParams.get('keyword') ?? '');
  const [onlyFavorites, setOnlyFavorites] = useState(() => searchParams.get('fav') === '1');
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync filters to URL
  const syncToUrl = useCallback(
    (institutions: string[], sectors: string[], kw: string, fav: boolean) => {
      const params = new URLSearchParams();
      if (institutions.length) params.set('institutions', institutions.join(','));
      if (sectors.length) params.set('sectors', sectors.join(','));
      if (kw) params.set('keyword', kw);
      if (fav) params.set('fav', '1');
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  const handleInstitutionsChange = useCallback(
    (val: string[]) => {
      setSelectedInstitutions(val);
      syncToUrl(val, selectedSectors, keyword, onlyFavorites);
    },
    [selectedSectors, keyword, onlyFavorites, syncToUrl]
  );

  const handleSectorsChange = useCallback(
    (val: string[]) => {
      setSelectedSectors(val);
      syncToUrl(selectedInstitutions, val, keyword, onlyFavorites);
    },
    [selectedInstitutions, keyword, onlyFavorites, syncToUrl]
  );

  const handleKeywordChange = useCallback(
    (val: string) => {
      setKeyword(val);
      syncToUrl(selectedInstitutions, selectedSectors, val, onlyFavorites);
    },
    [selectedInstitutions, selectedSectors, onlyFavorites, syncToUrl]
  );

  const handleOnlyFavoritesChange = useCallback(
    (val: boolean) => {
      setOnlyFavorites(val);
      syncToUrl(selectedInstitutions, selectedSectors, keyword, val);
    },
    [selectedInstitutions, selectedSectors, keyword, syncToUrl]
  );

  const handleReset = useCallback(() => {
    setSelectedInstitutions([]);
    setSelectedSectors([]);
    setKeyword('');
    setOnlyFavorites(false);
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // Compute filtered investments from merged data
  const filteredInvestments = useMemo(() => {
    return allInvestments.filter((inv) => {
      if (
        selectedInstitutions.length > 0 &&
        !selectedInstitutions.includes(inv.institution)
      )
        return false;
      if (selectedSectors.length > 0 && !selectedSectors.includes(inv.sector))
        return false;
      if (keyword && !inv.company.toLowerCase().includes(keyword.toLowerCase()))
        return false;
      if (onlyFavorites && !isFavorited(inv.id, 'investment')) return false;
      return true;
    }).sort((a, b) => {
      // Push '未披露' dates to the end
      if (a.date === '未披露' && b.date !== '未披露') return 1;
      if (b.date === '未披露' && a.date !== '未披露') return -1;
      return b.date.localeCompare(a.date);
    });
  }, [allInvestments, selectedInstitutions, selectedSectors, keyword, onlyFavorites, isFavorited]);

  const liveCount = liveInvestments.length;

  const favoriteCount = useMemo(
    () => favorites.filter((f) => f.type === 'investment').length,
    [favorites]
  );

  const activeFilterCount =
    selectedInstitutions.length +
    selectedSectors.length +
    (keyword ? 1 : 0) +
    (onlyFavorites ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <main className="space-y-6 md:space-y-8">
        {/* Page Header */}
        <section className="w-full bg-gradient-to-r from-primary/8 via-background to-background py-8 md:py-12 border-b border-border/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <TrendingUp className="size-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                      投资事件库
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      追踪 IDG、红杉中国、高瓴等全球顶级 PE/VC 投资动态
                    </p>
                  </div>
                </div>
                <LiveIndicator
                  isLoading={isLiveLoading}
                  lastUpdate={lastUpdate}
                  error={error}
                  onRefresh={refresh}
                  phase={phase}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* AI Intelligence Panel */}
        {hasData && investmentSummary && (
          <section className="w-full">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <Card className="border-primary/20 bg-card/60">
                <div
                  className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => setShowAiPanel(!showAiPanel)}
                >
                  <div className="flex items-center gap-2">
                    <Brain className="size-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">AI 实时投资情报</span>
                    <Badge variant="outline" className="text-primary border-primary/30 text-xs gap-0.5">
                      <Sparkles className="size-2.5" />
                      LIVE
                    </Badge>
                  </div>
                  {showAiPanel ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </div>
                <AnimatePresence>
                  {showAiPanel && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <CardContent className="pt-0 border-t border-border/20">
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary py-4">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {investmentSummary}
                          </ReactMarkdown>
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </div>
          </section>
        )}

        {/* Main Content */}
        <section className="w-full py-4 md:py-6">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex gap-6 min-w-0">
              {/* Desktop Filter Aside */}
              <aside className="hidden lg:block w-72 shrink-0">
                <InvestmentFilterAside
                  institutions={allInstitutions}
                  sectors={allSectors}
                  selectedInstitutions={selectedInstitutions}
                  selectedSectors={selectedSectors}
                  keyword={keyword}
                  onlyFavorites={onlyFavorites}
                  favoriteCount={favoriteCount}
                  onInstitutionsChange={handleInstitutionsChange}
                  onSectorsChange={handleSectorsChange}
                  onKeywordChange={handleKeywordChange}
                  onOnlyFavoritesChange={handleOnlyFavoritesChange}
                  onReset={handleReset}
                />
              </aside>

              {/* Right Content Area */}
              <div className="flex-1 min-w-0 space-y-4">
                {/* Toolbar: Mobile filter + View toggle + Result count */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* Mobile filter trigger */}
                    <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                      <SheetTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="lg:hidden gap-1.5"
                        >
                          <SlidersHorizontal className="size-3.5" />
                          筛选
                          {activeFilterCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="ml-0.5 h-5 px-1.5 text-xs tabular-nums"
                            >
                              {activeFilterCount}
                            </Badge>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-80 p-0 overflow-y-auto">
                        <SheetHeader className="sr-only">
                          <SheetTitle>筛选条件</SheetTitle>
                        </SheetHeader>
                        <div className="p-4">
                          <InvestmentFilterAside
                            institutions={allInstitutions}
                            sectors={allSectors}
                            selectedInstitutions={selectedInstitutions}
                            selectedSectors={selectedSectors}
                            keyword={keyword}
                            onlyFavorites={onlyFavorites}
                            favoriteCount={favoriteCount}
                            onInstitutionsChange={handleInstitutionsChange}
                            onSectorsChange={handleSectorsChange}
                            onKeywordChange={handleKeywordChange}
                            onOnlyFavoritesChange={handleOnlyFavoritesChange}
                            onReset={handleReset}
                          />
                        </div>
                      </SheetContent>
                    </Sheet>

                    {/* Result count */}
                    <span className="text-sm text-muted-foreground tabular-nums">
                      共{' '}
                      <span className="font-semibold text-foreground">
                        {filteredInvestments.length}
                      </span>{' '}
                      笔投资
                      {!isLiveLoading && liveCount > 0 && (
                        <span className="ml-1.5 text-primary text-xs">
                          (实时数据)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* View toggle */}
                  <Tabs
                    value={viewMode}
                    onValueChange={(v) => setViewMode(v as ViewMode)}
                  >
                    <TabsList className="h-9">
                      <TabsTrigger value="tree" className="gap-1.5 text-xs px-3">
                        <FolderTree className="size-3.5" />
                        <span className="hidden sm:inline">目录视图</span>
                      </TabsTrigger>
                      <TabsTrigger value="timeline" className="gap-1.5 text-xs px-3">
                        <Clock className="size-3.5" />
                        <span className="hidden sm:inline">时间线</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Active filter badges */}
                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedInstitutions.map((inst) => (
                      <Badge
                        key={inst}
                        variant="secondary"
                        className="text-xs gap-1 cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors"
                        onClick={() =>
                          handleInstitutionsChange(
                            selectedInstitutions.filter((s) => s !== inst)
                          )
                        }
                      >
                        {inst} ✕
                      </Badge>
                    ))}
                    {selectedSectors.map((sec) => (
                      <Badge
                        key={sec}
                        variant="secondary"
                        className="text-xs gap-1 cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors"
                        onClick={() =>
                          handleSectorsChange(
                            selectedSectors.filter((s) => s !== sec)
                          )
                        }
                      >
                        {sec} ✕
                      </Badge>
                    ))}
                    {keyword && (
                      <Badge
                        variant="secondary"
                        className="text-xs gap-1 cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors"
                        onClick={() => handleKeywordChange('')}
                      >
                        搜索: {keyword} ✕
                      </Badge>
                    )}
                    {onlyFavorites && (
                      <Badge
                        variant="secondary"
                        className="text-xs gap-1 cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors"
                        onClick={() => handleOnlyFavoritesChange(false)}
                      >
                        只看收藏 ✕
                      </Badge>
                    )}
                  </div>
                )}

                {/* View Content */}
                <AnimatePresence mode="wait">
                  {isLiveLoading && allInvestments.length === 0 ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-20 text-center"
                    >
                      <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <Loader2 className="size-7 text-primary animate-spin" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        正在搜索全网最新数据...
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        正在并行搜索多个领域的最新投融资与展会情报，预计需要 10-15 秒
                      </p>
                    </motion.div>
                  ) : filteredInvestments.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-20 text-center"
                    >
                      <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                        <TrendingUp className="size-7 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        暂无匹配的投资事件
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        尝试调整筛选条件或重置过滤器，查看更多投资事件
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={handleReset}
                      >
                        重置筛选
                      </Button>
                    </motion.div>
                  ) : viewMode === 'tree' ? (
                    <motion.div
                      key="tree"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.25 }}
                    >
                      <InvestmentTreeSection
                        investments={filteredInvestments}
                        isFavorited={isFavorited}
                        onToggleFavorite={toggleFavorite}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="timeline"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.25 }}
                    >
                      <InvestmentTimelineSection
                        investments={filteredInvestments}
                        isFavorited={(id) => isFavorited(id, 'investment')}
                        toggleFavorite={(id) => toggleFavorite(id, 'investment')}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
