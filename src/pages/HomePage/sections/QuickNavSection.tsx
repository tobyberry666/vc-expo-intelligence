import { NavLink } from 'react-router-dom';
import { Building2, Layers, CalendarDays, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const QUICK_NAV_ITEMS = [
  {
    to: '/investments?view=institution',
    icon: Building2,
    title: '按机构浏览',
    desc: '查看 IDG、红杉中国、高瓴等顶级机构的投资组合',
    color: 'text-primary',
    bgAccent: 'bg-primary/10',
  },
  {
    to: '/investments?view=sector',
    icon: Layers,
    title: '按赛道浏览',
    desc: '聚焦 AI、大模型、新能源等热门赛道投资动态',
    color: 'text-chart-2',
    bgAccent: 'bg-chart-2/10',
  },
  {
    to: '/expos',
    icon: CalendarDays,
    title: '科技展会',
    desc: '追踪 CES、MWC、WAIC 等全球展会中国企业参展情况',
    color: 'text-chart-4',
    bgAccent: 'bg-chart-4/10',
  },
];

export default function QuickNavSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">快捷入口</h2>
        <span className="text-xs text-muted-foreground">选择维度快速浏览</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {QUICK_NAV_ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <NavLink
                to={item.to}
                className="group flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-5 transition-all hover-elevate hover:border-border"
              >
                <div className={`size-10 rounded-lg ${item.bgAccent} flex items-center justify-center`}>
                  <Icon className={`size-5 ${item.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  <span>前往查看</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </NavLink>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
