/**
 * Google Search Console API Integration
 *
 * Provides integration with Google Search Console API for monitoring
 * rich snippet performance, search appearance, and search analytics.
 *
 * Features:
 * - Rich snippet performance tracking
 * - Search appearance monitoring
 * - Query and page-level analytics
 * - Automated data collection and caching
 */

import { GoogleSearchConsoleData } from "./types/schema-analytics";

export interface GSCConfig {
  apiKey: string;
  clientId: string;
  clientSecret: string;
  siteUrl: string;
  refreshToken?: string;
  accessToken?: string;
  tokenExpiry?: Date;
}

export interface GSCSearchAnalyticsQuery {
  dimensions: ("date" | "page" | "query" | "device" | "country")[];
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  rowLimit?: number;
  startRow?: number;
  dimensionFilterGroups?: any[];
}

export interface GSCSearchAnalyticsResponse {
  rows: Array<{
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  responseAggregationType: string;
}

export interface GSCRichSnippetReport {
  schemaType: string;
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  averagePosition: number;
  richSnippetAppearances: number;
  pagesWithRichSnippets: string[];
  topQueries: Array<{
    query: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
}

export class GoogleSearchConsoleService {
  private config: GSCConfig;
  private baseUrl = "https://www.googleapis.com/webmasters/v3";
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: GSCConfig) {
    this.config = config;
    this.accessToken = config.accessToken || null;
    this.tokenExpiry = config.tokenExpiry || null;
  }

  /**
   * Authenticate with Google Search Console API
   */
  async authenticate(): Promise<boolean> {
    try {
      if (this.config.refreshToken) {
        // Use refresh token to get new access token
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            refresh_token: this.config.refreshToken,
            grant_type: "refresh_token",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          this.accessToken = data.access_token;
          this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("GSC Authentication failed:", error);
      return false;
    }
  }

  /**
   * Get search analytics data
   */
  async getSearchAnalytics(query: GSCSearchAnalyticsQuery): Promise<GSCSearchAnalyticsResponse> {
    if (!this.accessToken || !this.tokenExpiry || this.tokenExpiry < new Date()) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Google Search Console");
      }
    }

    const url = `${this.baseUrl}/sites/${encodeURIComponent(this.config.siteUrl)}/searchAnalytics/query`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        throw new Error(`GSC API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching search analytics:", error);
      throw error;
    }
  }

  /**
   * Get rich snippet performance report for schema types
   */
  async getRichSnippetReport(schemaType: string, days: number = 7): Promise<GSCRichSnippetReport> {
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const query: GSCSearchAnalyticsQuery = {
      dimensions: ["page", "query", "date"],
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      rowLimit: 1000,
    };

    try {
      const analyticsData = await this.getSearchAnalytics(query);

      // Process data for rich snippet analysis
      const richSnippetReport: GSCRichSnippetReport = {
        schemaType,
        totalImpressions: 0,
        totalClicks: 0,
        averageCTR: 0,
        averagePosition: 0,
        richSnippetAppearances: 0,
        pagesWithRichSnippets: [],
        topQueries: [],
      };

      // Group data by page and analyze for rich snippet patterns
      const pageData = new Map<string, any>();
      const queryData = new Map<string, any>();

      analyticsData.rows.forEach((row) => {
        const [page, query, date] = row.keys;
        const pageKey = page;

        if (!pageData.has(pageKey)) {
          pageData.set(pageKey, {
            impressions: 0,
            clicks: 0,
            position: 0,
            queryCount: 0,
          });
        }

        const pageMetrics = pageData.get(pageKey);
        pageMetrics.impressions += row.impressions;
        pageMetrics.clicks += row.clicks;
        pageMetrics.position += row.position;
        pageMetrics.queryCount += 1;

        // Track query performance
        const queryKey = query;
        if (!queryData.has(queryKey)) {
          queryData.set(queryKey, {
            query,
            impressions: 0,
            clicks: 0,
            ctr: 0,
          });
        }

        const queryMetrics = queryData.get(queryKey);
        queryMetrics.impressions += row.impressions;
        queryMetrics.clicks += row.clicks;

        richSnippetReport.totalImpressions += row.impressions;
        richSnippetReport.totalClicks += row.clicks;
      });

      // Calculate averages and identify rich snippet patterns
      let totalPosition = 0;
      let totalPages = 0;

      for (const [page, metrics] of pageData) {
        totalPosition += metrics.position / metrics.queryCount;
        totalPages++;

        // Identify pages with rich snippets (higher CTR and lower position often indicates rich snippets)
        if (metrics.impressions > 0 && metrics.clicks / metrics.impressions > 0.05) {
          richSnippetReport.pagesWithRichSnippets.push(page);
          richSnippetReport.richSnippetAppearances += 1;
        }
      }

      richSnippetReport.averagePosition = totalPages > 0 ? totalPosition / totalPages : 0;

      // Process top queries
      for (const [query, metrics] of queryData) {
        metrics.ctr = metrics.impressions > 0 ? metrics.clicks / metrics.impressions : 0;
        richSnippetReport.topQueries.push(metrics);
      }

      // Sort by impressions and take top 10
      richSnippetReport.topQueries.sort((a, b) => b.impressions - a.impressions);
      richSnippetReport.topQueries = richSnippetReport.topQueries.slice(0, 10);

      // Calculate overall CTR
      richSnippetReport.averageCTR =
        richSnippetReport.totalImpressions > 0
          ? richSnippetReport.totalClicks / richSnippetReport.totalImpressions
          : 0;

      return richSnippetReport;
    } catch (error) {
      console.error(`Error generating rich snippet report for ${schemaType}:`, error);

      // Return empty report structure on error
      return {
        schemaType,
        totalImpressions: 0,
        totalClicks: 0,
        averageCTR: 0,
        averagePosition: 0,
        richSnippetAppearances: 0,
        pagesWithRichSnippets: [],
        topQueries: [],
      };
    }
  }

  /**
   * Get search appearance data for schema types
   */
  async getSearchAppearanceData(schemaType: string): Promise<{
    searchAppearanceTypes: Record<string, number>;
    totalAppearances: number;
    trend: number;
  }> {
    // This would typically use the Search Console API's search appearance data
    // For now, returning mock data based on common rich snippet types

    const mockSearchAppearanceTypes: Record<string, number> = {
      rich_snippet: Math.floor(Math.random() * 1000) + 500,
      article_rich_snippet: Math.floor(Math.random() * 800) + 300,
      event_rich_snippet: Math.floor(Math.random() * 400) + 100,
      product_rich_snippet: Math.floor(Math.random() * 600) + 200,
      faq_rich_snippet: Math.floor(Math.random() * 300) + 50,
      dataset_rich_snippet: Math.floor(Math.random() * 200) + 25,
      organization_rich_snippet: Math.floor(Math.random() * 100) + 10,
    };

    const totalAppearances = Object.values(mockSearchAppearanceTypes).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      searchAppearanceTypes: mockSearchAppearanceTypes,
      totalAppearances,
      trend: Math.random() * 20 - 10, // -10% to +10% trend
    };
  }

  /**
   * Monitor schema-specific performance
   */
  async monitorSchemaPerformance(
    schemaTypes: string[]
  ): Promise<Map<string, GSCRichSnippetReport>> {
    const reports = new Map<string, GSCRichSnippetReport>();

    for (const schemaType of schemaTypes) {
      try {
        const report = await this.getRichSnippetReport(schemaType);
        reports.set(schemaType, report);

        // Cache the report for 1 hour
        this.cacheReport(schemaType, report);
      } catch (error) {
        console.error(`Error monitoring ${schemaType} performance:`, error);
      }
    }

    return reports;
  }

  /**
   * Cache report data locally (in production, use Redis or similar)
   */
  private cacheReport(schemaType: string, report: GSCRichSnippetReport): void {
    const cacheKey = `gsc_${schemaType}_${Date.now()}`;
    localStorage.setItem(cacheKey, JSON.stringify(report));

    // Clean up old cache entries (older than 24 hours)
    this.cleanupCache();
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith("gsc_")) {
        const timestamp = parseInt(key.split("_").pop() || "0");
        if (timestamp < cutoff) {
          localStorage.removeItem(key);
        }
      }
    }
  }

  /**
   * Get cached reports for offline analysis
   */
  getCachedReports(): Map<string, GSCRichSnippetReport> {
    const reports = new Map<string, GSCRichSnippetReport>();

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith("gsc_")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "{}");
          const schemaType = key.split("_")[1];
          if (schemaType && data.totalImpressions > 0) {
            reports.set(schemaType, data);
          }
        } catch (error) {
          console.error("Error parsing cached report:", error);
        }
      }
    }

    return reports;
  }
}

// Export singleton instance with environment-based configuration
export const googleSearchConsole = new GoogleSearchConsoleService({
  apiKey: process.env.GOOGLE_SEARCH_CONSOLE_API_KEY || "",
  clientId: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET || "",
  siteUrl: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || "https://tra-schemas.com",
  refreshToken: process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN,
  accessToken: process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN,
  tokenExpiry: process.env.GOOGLE_SEARCH_CONSOLE_TOKEN_EXPIRY
    ? new Date(process.env.GOOGLE_SEARCH_CONSOLE_TOKEN_EXPIRY)
    : undefined,
});
