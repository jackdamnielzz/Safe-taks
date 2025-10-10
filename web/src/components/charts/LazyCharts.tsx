/**
 * Lazy-loaded Recharts Components
 * Reduces initial bundle size by ~150KB by dynamically importing Recharts
 *
 * Usage:
 * import { LazyPieChart, LazyBar, LazyResponsiveContainer } from '@/components/charts/LazyCharts';
 *
 * These components will be loaded on-demand when the chart is rendered,
 * significantly reducing the initial JavaScript bundle size.
 */

import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Loading component for charts
const ChartLoader = () => (
  <div className="flex items-center justify-center h-64">
    <LoadingSpinner size="lg" />
  </div>
);

// Chart containers
export const LazyResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.ResponsiveContainer })),
  { ssr: false }
);

// Chart types
export const LazyPieChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.PieChart })),
  { loading: ChartLoader, ssr: false }
);

export const LazyBarChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.BarChart })),
  { loading: ChartLoader, ssr: false }
);

export const LazyLineChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.LineChart })),
  { loading: ChartLoader, ssr: false }
);

export const LazyComposedChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.ComposedChart })),
  { loading: ChartLoader, ssr: false }
);

export const LazyAreaChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.AreaChart })),
  { loading: ChartLoader, ssr: false }
);

// Chart elements
export const LazyPie = dynamic(() => import("recharts").then((mod) => ({ default: mod.Pie })), {
  ssr: false,
});

export const LazyBar = dynamic(() => import("recharts").then((mod) => ({ default: mod.Bar })), {
  ssr: false,
});

export const LazyLine = dynamic(() => import("recharts").then((mod) => ({ default: mod.Line })), {
  ssr: false,
});

export const LazyArea = dynamic(() => import("recharts").then((mod) => ({ default: mod.Area })), {
  ssr: false,
});

export const LazyCell = dynamic(() => import("recharts").then((mod) => ({ default: mod.Cell })), {
  ssr: false,
});

// Axes
export const LazyXAxis = dynamic(() => import("recharts").then((mod) => ({ default: mod.XAxis })), {
  ssr: false,
});

export const LazyYAxis = dynamic(() => import("recharts").then((mod) => ({ default: mod.YAxis })), {
  ssr: false,
});

// Grid and decorations
export const LazyCartesianGrid = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.CartesianGrid })),
  { ssr: false }
);

export const LazyTooltip = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.Tooltip })),
  { ssr: false }
);

export const LazyLegend = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.Legend as any })),
  { ssr: false }
);
