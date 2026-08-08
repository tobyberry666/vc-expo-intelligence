import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, ChevronDown, ChevronUp, Calendar, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useFavorites } from '@/hooks/useFavorites';
import { useLiveFeed } from '@/hooks/useLiveFeed';
import LiveIndicator from '@/components/LiveIndicator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ExpoFilterAside from './sections/ExpoFilterAside';
import ExpoGridSection from './sections/ExpoGridSection';

export default function ExposPage() {
  const { favorites, isFavorited } = useFavorites();
  const { expoSummary, liveExpos, isLoading: isLiveLoading, phase, lastUpdate, error, refresh, hasData } = useLiveFeed();
  const [showAiPanel, setShowAiPanel] = useState(true);

  const [keyword, setKeyword] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [location, setLocation] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const expoFavoriteCount = useMemo(
    () => favorites.filter((f) => f.type === 'expo').length,
    [favorites]
  );

  // All data comes from AI live search
  const allExpos = useMemo(() => {
    return liveExpos.map((le) => ({
      ...le,
      id: le.id,
      imageUrl: '',
      source: 'live' as const,
    }));
  }, [liveExpos]);

  const liveCount = liveExpos.length;

  const filteredExpos = useMemo(() => {
    let result = [...allExpos];

    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(kw) ||
          e.description.toLowerCase().includes(kw)
      );
    }

    if (selectedTypes.length > 0) {
      result = result.filter((e) => selectedTypes.includes(e.type));
    }

    if (location !== 'all') {
      result = result.filter((e) => e.location === location);
    }

    if (onlyFavorites) {
      result = result.filter((e) => isFavorited(e.id, 'expo'));
    }

    const safeDate = (d: string) => d === '未披露' ? 0 : new Date(d).getTime() || 0;
    switch (sortBy) {
      case 'date_asc':
        result.sort((a, b) => safeDate(a.startDate) - safeDate(b.startDate));
        break;
      case 'exhibitor_desc':
        result.sort((a, b) => b.chineseExhibitorCount - a.chineseExhibitorCount);
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'date_desc':
      default:
        result.sort((a, b) => safeDate(b.startDate) - safeDate(a.startDate));
        break;
    }

    return result;
  }, [allExpos, keyword, selectedTypes, location, sortBy, onlyFavorites, isFavorited]);

  const handleReset = () => {
    setKeyword('');
    setSelectedTypes([]);
    setLocation('all');
    setSortBy('date_desc');
    setOnlyFavorites(false);
  };

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Hero */}
      <section className="w-full bg-gradient-to-br from-primary/8 via-background to-secondary/10 py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
                <Calendar className="size-8 text-primary" />
                科技展会
              </h1>
              <p className="mt-2 text-muted-foreground text-base max-w-2xl">
                追踪 CES、MWC、WAIC 等全球顶级科技展会，一览中国企业参展动态
              </p>
            </div>
            <LiveIndicator
              isLoading={isLiveLoading}
              lastUpdate={lastUpdate}
              error={error}
              onRefresh={refresh}
              phase={phase}
            />
          </div>
        </div>
      </section>

      {/* AI Intelligence Panel */}
      {hasData && expoSummary && (
        <section className="w-full">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <Card className="border-primary/20 bg-card/60">
              <div
                className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => setShowAiPanel(!showAiPanel)}
              >
                <div className="flex items-center gap-2">
                  <Brain className="size-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">AI 实时展会情报</span>
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
                          {expoSummary}
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

      {/* Filter + Grid */}
      <section className="w-full py-4">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <ExpoFilterAside
              expos={allExpos}
              keyword={keyword}
              onKeywordChange={setKeyword}
              selectedTypes={selectedTypes}
              onSelectedTypesChange={setSelectedTypes}
              location={location}
              onLocationChange={setLocation}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              onlyFavorites={onlyFavorites}
              onOnlyFavoritesChange={setOnlyFavorites}
              favoriteCount={expoFavoriteCount}
              onReset={handleReset}
              resultCount={filteredExpos.length}
            />
            <div className="flex-1 min-w-0 space-y-3">
              <p className="text-sm text-muted-foreground tabular-nums">
                共{' '}
                <span className="font-semibold text-foreground">
                  {filteredExpos.length}
                </span>{' '}
                个展会
                {!isLiveLoading && liveCount > 0 && (
                  <span className="ml-1.5 text-primary text-xs">
                    (实时数据)
                  </span>
                )}
              </p>
              {isLiveLoading && allExpos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Loader2 className="size-7 text-primary animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    正在搜索全网最新数据...
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    正在并行搜索全球科技展会最新情报，预计需要 10-15 秒
                  </p>
                </div>
              ) : (
                <ExpoGridSection expos={filteredExpos} />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
