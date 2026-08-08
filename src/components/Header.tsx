import { NavLink, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Calendar, Radar, Github } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: '情报概览', icon: Home },
  { path: '/investments', label: '投资事件', icon: TrendingUp },
  { path: '/expos', label: '科技展会', icon: Calendar },
];

export default function Header() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="size-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <Radar className="size-5" />
          </div>
          <div className="hidden sm:block">
            <span className="text-base font-bold text-foreground tracking-tight">全球创投资讯</span>
            <span className="block text-[10px] text-muted-foreground -mt-0.5">VC & Expo Intelligence</span>
          </div>
        </NavLink>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/'
              ? pathname === '/'
              : pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`
                }
              >
                <Icon className={`size-4 ${isActive ? 'text-primary' : ''}`} />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* GitHub Profile */}
        <a
          href="https://github.com/tobyberry666"
          target="_blank"
          rel="noopener noreferrer"
          title="Toby's GitHub"
          className="flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors shrink-0"
        >
          <Github className="size-5" />
        </a>
      </div>
    </header>
  );
}
