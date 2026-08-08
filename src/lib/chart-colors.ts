// Chart color hex values derived from tailwind-theme.css chart-1~5 HSL tokens.
// Use these when feeding color props to chart libraries (ECharts / recharts)
// which require hex strings rather than CSS custom properties.

/** hsl(38 90% 55%) — golden amber */
export const CHART_1 = '#F4A825';

/** hsl(68 90% 55%) — lime green */
export const CHART_2 = '#D8F425';

/** hsl(98 90% 55%) — spring green */
export const CHART_3 = '#71F425';

/** hsl(128 90% 55%) — emerald */
export const CHART_4 = '#25F441';

/** hsl(158 90% 55%) — teal */
export const CHART_5 = '#25F4A8';

export const CHART_COLORS = [CHART_1, CHART_2, CHART_3, CHART_4, CHART_5] as const;
