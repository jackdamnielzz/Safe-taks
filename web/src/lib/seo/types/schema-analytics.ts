/**
 * TypeScript type definitions for Schema Analytics
 */

export interface RichSnippetData {
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate as decimal (0.07 = 7%)
  appearanceRate: number; // Rate of eligible pages that show rich results
  richResults: {
    total: number;
    types: Record<string, number>;
  };
  searchAppearance: Record<
    string,
    {
      impressions: number;
      clicks: number;
    }
  >;
}

export interface AIDiscoverabilityMetrics {
  discoveryRate: number; // How discoverable schemas are by AI (0-1)
  understandabilityScore: number; // How well AI understands the schema (0-10)
  structuredDataUsage: number; // How well AI uses the structured data (0-1)
  aiSearchVisibility: number; // Visibility in AI-powered search results (0-1)
  recommendations: string[]; // AI optimization recommendations
}

export interface SchemaQualityMetrics {
  totalSchemas: number;
  validSchemas: number;
  errorRate: number;
  averageScore: number;
  improvementTrend: number; // Percentage change from previous period
}

export interface PerformanceImpact {
  searchImpressions: number;
  clickThroughRate: number;
  searchAppearanceRate: number;
  aiDiscoveryRate: number;
  trend: number; // Performance trend percentage
}

export interface TechnicalMetrics {
  averageGenerationTime: number; // milliseconds
  averageValidationTime: number; // milliseconds
  cacheHitRate: number;
  errorBreakdown: Record<string, number>;
}

export interface SchemaPerformanceMetrics {
  schemaType: string;
  timestamp: Date;
  period: {
    start: Date;
    end: Date;
  };
  richSnippetMetrics?: RichSnippetData;
  aiDiscoverabilityMetrics: AIDiscoverabilityMetrics;
  schemaQuality: SchemaQualityMetrics;
  performanceImpact: PerformanceImpact;
  technicalMetrics: TechnicalMetrics;
}

export interface SchemaAnalyticsAlert {
  type: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  schemaType?: string;
  metric?: string;
  threshold?: number;
  currentValue?: number;
}

export interface SchemaPerformanceReport {
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalSchemas: number;
    totalImpressions: number;
    totalClicks: number;
    averageCTR: number;
    averageScore: number;
  };
  schemaBreakdown: SchemaPerformanceMetrics[];
  alerts: SchemaAnalyticsAlert[];
  trends: {
    impressions: number;
    ctr: number;
    quality: number;
    aiDiscovery: number;
  };
  recommendations: string[];
}

export interface GoogleSearchConsoleData {
  siteUrl: string;
  query: string;
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  richSnippetType?: string;
  date: string;
}

export interface AIAnalysisResult {
  schemaUrl: string;
  schemaType: string;
  understandabilityScore: number;
  extractionAccuracy: number;
  contextRelevance: number;
  recommendations: string[];
  analyzedBy: string; // AI provider used
  confidence: number;
}

export interface SchemaMonitoringConfig {
  enabled: boolean;
  collectionInterval: number; // minutes
  retentionPeriod: number; // days
  alertThresholds: {
    ctr: number;
    impressions: number;
    errorRate: number;
    qualityScore: number;
  };
  integrations: {
    googleSearchConsole: boolean;
    aiAnalysis: boolean;
    slack: boolean;
    email: boolean;
  };
}
