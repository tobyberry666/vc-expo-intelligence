import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Layers, ChevronRight, Star, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import type { IInvestment } from '@/data/investments';

interface InstitutionGroup {
  institution: string;
  sectors: {
    sector: string;
    investments: IInvestment[];
  }[];
  totalCount: number;
}

interface InvestmentTreeSectionProps {
  investments: IInvestment[];
  isFavorited: (id: string, type: 'investment' | 'expo') => boolean;
  onToggleFavorite: (id: string, type: 'investment' | 'expo') => void;
}

export default function InvestmentTreeSection({
  investments,
  isFavorited,
  onToggleFavorite,
}: InvestmentTreeSectionProps) {
  const navigate = useNavigate();

  const grouped = useMemo<InstitutionGroup[]>(() => {
    const instMap = new Map<string, Map<string, IInvestment[]>>();

    for (const inv of investments) {
      if (!instMap.has(inv.institution)) {
        instMap.set(inv.institution, new Map());
      }
      const sectorMap = instMap.get(inv.institution)!;
      if (!sectorMap.has(inv.sector)) {
        sectorMap.set(inv.sector, []);
      }
      sectorMap.get(inv.sector)!.push(inv);
    }

    return Array.from(instMap.entries()).map(([institution, sectorMap]) => {
      const sectors = Array.from(sectorMap.entries()).map(([sector, invs]) => ({
        sector,
        investments: invs.sort((a, b) => b.date.localeCompare(a.date)),
      }));
      return {
        institution,
        sectors: sectors.sort((a, b) => b.investments.length - a.investments.length),
        totalCount: sectors.reduce((sum, s) => sum + s.investments.length, 0),
      };
    }).sort((a, b) => b.totalCount - a.totalCount);
  }, [investments]);

  if (investments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Layers className="size-12 mb-3 opacity-40" />
        <p className="text-sm">暂无匹配的投资记录</p>
        <p className="text-xs mt-1">尝试调整筛选条件</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 mb-3">
        <p className="text-xs text-muted-foreground">
          共 <span className="text-foreground font-medium">{investments.length}</span> 笔投资 ·{' '}
          <span className="text-foreground font-medium">{grouped.length}</span> 家机构
        </p>
      </div>

      <Accordion type="multiple" className="space-y-1.5">
        {grouped.map((inst) => (
          <AccordionItem
            key={inst.institution}
            value={inst.institution}
            className="border border-border/40 rounded-xl bg-card/60 overflow-hidden data-[state=open]:bg-card/80 transition-colors"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline [&>svg]:hidden">
              <div className="flex items-center gap-3 w-full min-w-0">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Building2 className="size-4" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-sm font-semibold text-foreground truncate block">
                    {inst.institution}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {inst.sectors.length} 个赛道
                  </span>
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs tabular-nums">
                  {inst.totalCount} 笔
                </Badge>
                <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-3 pb-3">
              <Accordion type="multiple" className="space-y-1 ml-2">
                {inst.sectors.map((sectorGroup) => (
                  <AccordionItem
                    key={sectorGroup.sector}
                    value={sectorGroup.sector}
                    className="border border-border/30 rounded-lg bg-muted/30 overflow-hidden data-[state=open]:bg-muted/50 transition-colors"
                  >
                    <AccordionTrigger className="px-3 py-2.5 text-sm hover:no-underline [&>svg]:hidden">
                      <div className="flex items-center gap-2.5 w-full min-w-0">
                        <div className="size-6 rounded-md bg-secondary/60 text-secondary-foreground flex items-center justify-center shrink-0">
                          <Layers className="size-3" />
                        </div>
                        <span className="flex-1 min-w-0 truncate text-left font-medium text-foreground/90 text-xs">
                          {sectorGroup.sector}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {sectorGroup.investments.length} 笔
                        </span>
                        <ChevronRight className="size-3.5 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-2 pb-2">
                      <div className="space-y-1.5 ml-3 border-l-2 border-primary/20 pl-3">
                        {sectorGroup.investments.map((inv) => {
                          const fav = isFavorited(inv.id, 'investment');
                          return (
                            <div
                              key={inv.id}
                              className="group relative flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/40 transition-colors cursor-pointer"
                              onClick={() => navigate(`/investments/${inv.id}`)}
                            >
                              <div className="size-5 mt-0.5 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <TrendingUp className="size-3" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                    {inv.company}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {inv.round}
                                  </Badge>
                                  {(inv.source === 'live' || inv.id.startsWith('live-')) && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30 gap-0.5">
                                      <Sparkles className="size-2" />
                                      实时
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {inv.summary}
                                </p>

                                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="size-3" />
                                    {inv.amount}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    {inv.date}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="shrink-0 mt-1 p-1 rounded-md hover:bg-accent/60 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleFavorite(inv.id, 'investment');
                                }}
                                aria-label={fav ? '取消收藏' : '收藏'}
                              >
                                <Star
                                  className={`size-3.5 transition-colors ${
                                    fav
                                      ? 'fill-primary text-primary'
                                      : 'text-muted-foreground/50 group-hover:text-muted-foreground'
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
