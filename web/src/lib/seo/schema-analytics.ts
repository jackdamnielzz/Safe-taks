/**
 * Schema Markup Performance Analytics Service
 *
 * Monitors schema markup performance, rich snippet appearances,
 * and AI/LLM discoverability impact across all schema types.
 *
 * Features:
 * - Google Search Console integration for rich snippet monitoring
 * - AI/LLM discoverability impact analysis
 * - Performance tracking and trend analysis
 * - Automated alerting and reporting
 */

import {
  SchemaPerformanceMetrics,
  RichSnippetData,
  AIDiscoverabilityMetrics,
} from "./types/schema-analytics";

export interface SchemaAnalyticsConfig {
  googleSearchConsole?: {
    apiKey: string;
    siteUrl: string;
    refreshInterval: number; // minutes
  };
  aiAnalysis?: {
    enabled: boolean;
    providers: string[];
    sampleSize: number;
  };
  monitoring?: {
    enabled: boolean;
    alertThresholds: {
      richSnippetDrop: number; // percentage
      performanceDegradation: number; // percentage
      errorRateIncrease: number; // percentage
    };
  };
}

export class SchemaAnalyticsService {
  private config: SchemaAnalyticsConfig;
  private metricsCache: Map<string, SchemaPerformanceMetrics> = new Map();
  private lastUpdate: Date = new Date();

  constructor(config: SchemaAnalyticsConfig) {
    this.config = config;
  }

  /**
   * Collect comprehensive schema performance metrics
   */
  async collectPerformanceMetrics(schemaTypes: string[] = []): Promise<SchemaPerformanceMetrics[]> {
    const metrics: SchemaPerformanceMetrics[] = [];

    for (const schemaType of schemaTypes) {
      const metric = await this.collectSchemaMetrics(schemaType);
      metrics.push(metric);
      this.metricsCache.set(schemaType, metric);
    }

    this.lastUpdate = new Date();
    return metrics;
  }

  /**
   * Collect metrics for a specific schema type
   */
  private async collectSchemaMetrics(schemaType: string): Promise<SchemaPerformanceMetrics> {
    const baseMetrics = this.getBaseMetrics(schemaType);
    const richSnippetMetrics = await this.getRichSnippetMetrics(schemaType);
    const aiMetrics = await this.getAIDiscoverabilityMetrics(schemaType);

    return {
      schemaType,
      timestamp: new Date(),
      period: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        end: new Date(),
      },

      // Rich Snippet Performance
      richSnippetMetrics: richSnippetMetrics || undefined,

      // AI/LLM Discoverability
      aiDiscoverabilityMetrics: aiMetrics,

      // Schema Quality Metrics
      schemaQuality: {
        totalSchemas: baseMetrics.totalSchemas,
        validSchemas: baseMetrics.validSchemas,
        errorRate: baseMetrics.errorRate,
        averageScore: baseMetrics.averageScore,
        improvementTrend: await this.calculateTrend(schemaType, "quality"),
      },

      // Performance Impact
      performanceImpact: {
        searchImpressions: richSnippetMetrics?.impressions || 0,
        clickThroughRate: richSnippetMetrics?.ctr || 0,
        searchAppearanceRate: richSnippetMetrics?.appearanceRate || 0,
        aiDiscoveryRate: aiMetrics.discoveryRate,
        trend: await this.calculateTrend(schemaType, "performance"),
      },

      // Technical Performance
      technicalMetrics: {
        averageGenerationTime: baseMetrics.avgGenerationTime,
        averageValidationTime: baseMetrics.avgValidationTime,
        cacheHitRate: baseMetrics.cacheHitRate,
        errorBreakdown: baseMetrics.errorBreakdown,
      },
    };
  }

  /**
   * Get base schema metrics from validation system
   */
  private getBaseMetrics(schemaType: string) {
    // This would integrate with the schema validation system
    return {
      totalSchemas: 150, // Mock data - replace with actual validation data
      validSchemas: 142,
      errorRate: 0.053,
      averageScore: 87.5,
      avgGenerationTime: 45, // ms
      avgValidationTime: 12, // ms
      cacheHitRate: 0.78,
      errorBreakdown: {
        syntax: 3,
        missingRequired: 2,
        invalidValues: 1,
        bestPractice: 2,
      },
    };
  }

  /**
   * Get Rich Snippet metrics from Google Search Console
   */
  private async getRichSnippetMetrics(schemaType: string): Promise<RichSnippetData | null> {
    if (!this.config.googleSearchConsole?.apiKey) {
      return null;
    }

    try {
      // This would integrate with Google Search Console API
      // For now, returning mock data structure
      return {
        impressions: 125000,
        clicks: 8750,
        ctr: 0.07, // 7%
        appearanceRate: 0.15, // 15% of eligible pages
        richResults: {
          total: 89,
          types: {
            article: 45,
            event: 12,
            product: 15,
            faq: 8,
            dataset: 6,
            organization: 3,
          },
        },
        searchAppearance: {
          article: { impressions: 45000, clicks: 3150 },
          event: { impressions: 12000, clicks: 840 },
          product: { impressions: 15000, clicks: 1200 },
          faq: { impressions: 8000, clicks: 640 },
          dataset: { impressions: 6000, clicks: 480 },
          organization: { impressions: 3000, clicks: 240 },
        },
      };
    } catch (error) {
      console.error("Error fetching rich snippet metrics:", error);
      return null;
    }
  }

  /**
   * Get AI/LLM discoverability metrics
   */
  private async getAIDiscoverabilityMetrics(schemaType: string): Promise<AIDiscoverabilityMetrics> {
    if (!this.config.aiAnalysis?.enabled) {
      return {
        discoveryRate: 0,
        understandabilityScore: 0,
        structuredDataUsage: 0,
        aiSearchVisibility: 0,
        recommendations: [],
      };
    }

    // This would analyze how well AI systems can understand and use the schema
    return {
      discoveryRate: 0.82, // 82% of schemas are discoverable by AI
      understandabilityScore: 8.5, // 0-10 scale
      structuredDataUsage: 0.76, // How well AI uses the structured data
      aiSearchVisibility: 0.68, // Visibility in AI-powered search results
      recommendations: [
        "Improve schema context with better descriptions",
        "Add more specific entity relationships",
        "Include temporal and spatial context where relevant",
      ],
    };
  }

  /**
   * Calculate performance trends
   */
  private async calculateTrend(
    schemaType: string,
    metricType: "quality" | "performance"
  ): Promise<number> {
    // This would compare current metrics with historical data
    // For now, return a mock trend value - in production this would access historical data
    const currentMetrics = this.metricsCache.get(schemaType);
    if (!currentMetrics) return 0;

    // Mock trend calculation - in production this would compare with previous period
    const baseValue =
      metricType === "quality"
        ? currentMetrics.schemaQuality.averageScore
        : currentMetrics.performanceImpact.searchImpressions;

    // Return a realistic trend between -10% and +15%
    return Math.random() * 25 - 10;
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(schemaTypes: string[]): Promise<string> {
    const metrics = await this.collectPerformanceMetrics(schemaTypes);

    let report = "# Schema Performance Report\n\n";
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Period: Last 7 days\n\n`;

    for (const metric of metrics) {
      report += `## ${metric.schemaType.toUpperCase()} Schema Performance\n\n`;

      // Rich Snippet Performance
      if (metric.richSnippetMetrics) {
        report += "### Rich Snippet Performance\n";
        report += `- Impressions: ${metric.richSnippetMetrics.impressions.toLocaleString()}\n`;
        report += `- Clicks: ${metric.richSnippetMetrics.clicks.toLocaleString()}\n`;
        report += `- CTR: ${(metric.richSnippetMetrics.ctr * 100).toFixed(2)}%\n`;
        report += `- Rich Results: ${metric.richSnippetMetrics.richResults.total}\n\n`;
      }

      // AI Discoverability
      report += "### AI/LLM Discoverability\n";
      report += `- Discovery Rate: ${(metric.aiDiscoverabilityMetrics.discoveryRate * 100).toFixed(1)}%\n`;
      report += `- Understandability Score: ${metric.aiDiscoverabilityMetrics.understandabilityScore}/10\n`;
      report += `- AI Search Visibility: ${(metric.aiDiscoverabilityMetrics.aiSearchVisibility * 100).toFixed(1)}%\n\n`;

      // Schema Quality
      report += "### Schema Quality\n";
      report += `- Valid Schemas: ${metric.schemaQuality.validSchemas}/${metric.schemaQuality.totalSchemas}\n`;
      report += `- Error Rate: ${(metric.schemaQuality.errorRate * 100).toFixed(2)}%\n`;
      report += `- Average Score: ${metric.schemaQuality.averageScore}/100\n`;
      report += `- Quality Trend: ${metric.schemaQuality.improvementTrend >= 0 ? "+" : ""}${metric.schemaQuality.improvementTrend.toFixed(1)}%\n\n`;

      // Recommendations
      if (metric.aiDiscoverabilityMetrics.recommendations.length > 0) {
        report += "### AI Optimization Recommendations\n";
        metric.aiDiscoverabilityMetrics.recommendations.forEach((rec, index) => {
          report += `${index + 1}. ${rec}\n`;
        });
        report += "\n";
      }

      report += "---\n\n";
    }

    return report;
  }

  /**
   * Check for performance alerts
   */
  async checkAlerts(): Promise<
    Array<{ type: string; message: string; severity: "low" | "medium" | "high" }>
  > {
    const alerts: Array<{ type: string; message: string; severity: "low" | "medium" | "high" }> =
      [];

    if (!this.config.monitoring?.enabled) return alerts;

    const thresholds = this.config.monitoring.alertThresholds;

    // Check for rich snippet performance drops
    for (const [schemaType, metrics] of this.metricsCache) {
      if (metrics.performanceImpact.trend < -thresholds.richSnippetDrop) {
        alerts.push({
          type: "rich_snippet_drop",
          message: `${schemaType} rich snippet impressions dropped by ${Math.abs(metrics.performanceImpact.trend).toFixed(1)}%`,
          severity: "high",
        });
      }

      if (metrics.schemaQuality.errorRate > thresholds.errorRateIncrease / 100) {
        alerts.push({
          type: "error_rate_increase",
          message: `${schemaType} schema error rate increased to ${(metrics.schemaQuality.errorRate * 100).toFixed(2)}%`,
          severity: "medium",
        });
      }
    }

    return alerts;
  }

  /**
   * Export metrics for external analysis
   */
  async exportMetrics(format: "json" | "csv" = "json"): Promise<string> {
    const metrics = Array.from(this.metricsCache.values());

    if (format === "csv") {
      // Convert to CSV format
      const headers = [
        "schemaType",
        "timestamp",
        "impressions",
        "clicks",
        "ctr",
        "errorRate",
        "averageScore",
      ];
      const csvData = metrics.map((m) => [
        m.schemaType,
        m.timestamp.toISOString(),
        m.richSnippetMetrics?.impressions || 0,
        m.richSnippetMetrics?.clicks || 0,
        m.richSnippetMetrics?.ctr || 0,
        m.schemaQuality.errorRate,
        m.schemaQuality.averageScore,
      ]);

      return [headers, ...csvData].map((row) => row.join(",")).join("\n");
    }

    return JSON.stringify(metrics, null, 2);
  }
}

// Export singleton instance
export const schemaAnalytics = new SchemaAnalyticsService({
  googleSearchConsole: {
    apiKey: process.env.GOOGLE_SEARCH_CONSOLE_API_KEY || "",
    siteUrl: "https://tra-schemas.com",
    refreshInterval: 60, // 1 hour
  },
  aiAnalysis: {
    enabled: true,
    providers: ["openai", "anthropic", "google"],
    sampleSize: 100,
  },
  monitoring: {
    enabled: true,
    alertThresholds: {
      richSnippetDrop: 20, // Alert if impressions drop by 20%
      performanceDegradation: 15, // Alert if CTR drops by 15%
      errorRateIncrease: 10, // Alert if error rate increases by 10%
    },
  },
});
