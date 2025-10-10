/**
 * Schema Performance Monitoring and Alerting System
 *
 * Provides automated monitoring of schema markup performance with
 * intelligent alerting based on configurable thresholds and trends.
 *
 * Features:
 * - Real-time performance monitoring
 * - Intelligent alerting with configurable thresholds
 * - Trend analysis and anomaly detection
 * - Multi-channel alerting (Slack, Email, Webhook)
 * - Performance degradation detection
 * - Automated reporting and escalation
 */

import {
  SchemaAnalyticsAlert,
  SchemaPerformanceMetrics,
  AIDiscoverabilityMetrics,
} from "./types/schema-analytics";
import { schemaAnalytics } from "./schema-analytics";
import { googleSearchConsole } from "./google-search-console";
import { aiDiscoverabilityAnalyzer } from "./ai-discoverability-analyzer";

export interface MonitoringConfig {
  enabled: boolean;
  checkInterval: number; // minutes
  alertThresholds: {
    // Performance thresholds
    ctr: number; // Click-through rate threshold
    impressions: number; // Minimum impressions threshold
    errorRate: number; // Schema error rate threshold
    qualityScore: number; // Minimum quality score threshold

    // Trend thresholds
    ctrTrend: number; // CTR trend percentage threshold
    impressionsTrend: number; // Impressions trend percentage threshold
    qualityTrend: number; // Quality score trend percentage threshold

    // AI thresholds
    aiDiscoverability: number; // AI discoverability score threshold
    aiUnderstandability: number; // AI understandability score threshold
  };
  integrations: {
    slack?: {
      enabled: boolean;
      webhookUrl: string;
      channel: string;
    };
    email?: {
      enabled: boolean;
      smtpConfig: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
          user: string;
          pass: string;
        };
      };
      recipients: string[];
    };
    webhook?: {
      enabled: boolean;
      url: string;
      secret?: string;
    };
  };
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (metrics: SchemaPerformanceMetrics) => boolean;
  severity: "low" | "medium" | "high" | "critical";
  channels: string[]; // Which alert channels to use
  cooldown: number; // Minutes to wait before sending similar alert
}

export class SchemaMonitoringService {
  private config: MonitoringConfig;
  private alertRules: AlertRule[] = [];
  private alertHistory: Map<string, Date> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.initializeAlertRules();
  }

  /**
   * Initialize default alert rules
   */
  private initializeAlertRules(): void {
    this.alertRules = [
      {
        id: "high_error_rate",
        name: "High Schema Error Rate",
        description: "Schema error rate exceeds threshold",
        condition: (metrics) =>
          metrics.schemaQuality.errorRate > this.config.alertThresholds.errorRate,
        severity: "high",
        channels: ["slack", "email"],
        cooldown: 60,
      },
      {
        id: "low_quality_score",
        name: "Low Schema Quality Score",
        description: "Schema quality score below threshold",
        condition: (metrics) =>
          metrics.schemaQuality.averageScore < this.config.alertThresholds.qualityScore,
        severity: "medium",
        channels: ["slack"],
        cooldown: 120,
      },
      {
        id: "ctr_drop",
        name: "Significant CTR Drop",
        description: "Click-through rate dropped significantly",
        condition: (metrics) => {
          return (
            metrics.performanceImpact.trend < -this.config.alertThresholds.ctrTrend &&
            metrics.performanceImpact.clickThroughRate < this.config.alertThresholds.ctr
          );
        },
        severity: "high",
        channels: ["slack", "email"],
        cooldown: 30,
      },
      {
        id: "impressions_drop",
        name: "Significant Impressions Drop",
        description: "Search impressions dropped significantly",
        condition: (metrics) => {
          return (
            metrics.performanceImpact.trend < -this.config.alertThresholds.impressionsTrend &&
            (metrics.richSnippetMetrics?.impressions || 0) < this.config.alertThresholds.impressions
          );
        },
        severity: "critical",
        channels: ["slack", "email", "webhook"],
        cooldown: 15,
      },
      {
        id: "ai_discoverability_low",
        name: "Low AI Discoverability",
        description: "AI discoverability score below threshold",
        condition: (metrics) =>
          metrics.aiDiscoverabilityMetrics.discoveryRate <
          this.config.alertThresholds.aiDiscoverability,
        severity: "medium",
        channels: ["slack"],
        cooldown: 180,
      },
      {
        id: "ai_understandability_poor",
        name: "Poor AI Understandability",
        description: "AI understandability score below threshold",
        condition: (metrics) => {
          const score = metrics.aiDiscoverabilityMetrics.understandabilityScore / 10; // Convert to 0-1 scale
          return score < this.config.alertThresholds.aiUnderstandability;
        },
        severity: "low",
        channels: ["slack"],
        cooldown: 240,
      },
    ];
  }

  /**
   * Start monitoring service
   */
  startMonitoring(schemaTypes: string[]): void {
    if (!this.config.enabled || this.isMonitoring) {
      return;
    }

    console.log("Starting schema performance monitoring...");
    this.isMonitoring = true;

    // Initial check
    this.performMonitoringCheck(schemaTypes);

    // Set up recurring checks
    this.monitoringInterval = setInterval(
      () => {
        this.performMonitoringCheck(schemaTypes);
      },
      this.config.checkInterval * 60 * 1000
    );

    console.log(`Monitoring started with ${this.config.checkInterval} minute intervals`);
  }

  /**
   * Stop monitoring service
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log("Schema performance monitoring stopped");
  }

  /**
   * Perform a single monitoring check
   */
  async performMonitoringCheck(schemaTypes: string[]): Promise<void> {
    try {
      console.log(`Performing monitoring check for ${schemaTypes.length} schema types...`);

      // Collect current metrics
      const metrics = await schemaAnalytics.collectPerformanceMetrics(schemaTypes);

      // Check each schema type against alert rules
      for (const metric of metrics) {
        await this.evaluateAlerts(metric);
      }

      console.log(`Monitoring check completed - evaluated ${metrics.length} schema types`);
    } catch (error) {
      console.error("Error during monitoring check:", error);

      // Send system alert for monitoring failures
      await this.sendSystemAlert({
        type: "monitoring_error",
        message: `Monitoring check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        severity: "high",
        timestamp: new Date(),
      });
    }
  }

  /**
   * Evaluate alert rules against metrics
   */
  private async evaluateAlerts(metrics: SchemaPerformanceMetrics): Promise<void> {
    for (const rule of this.alertRules) {
      try {
        const shouldAlert = rule.condition(metrics);

        if (shouldAlert) {
          const lastAlert = this.alertHistory.get(`${rule.id}_${metrics.schemaType}`);

          if (!lastAlert || this.isCooldownExpired(lastAlert, rule.cooldown)) {
            await this.triggerAlert(rule, metrics);
            this.alertHistory.set(`${rule.id}_${metrics.schemaType}`, new Date());
          }
        }
      } catch (error) {
        console.error(`Error evaluating alert rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Check if cooldown period has expired
   */
  private isCooldownExpired(lastAlert: Date, cooldownMinutes: number): boolean {
    const cooldownMs = cooldownMinutes * 60 * 1000;
    return Date.now() - lastAlert.getTime() > cooldownMs;
  }

  /**
   * Trigger alert across configured channels
   */
  private async triggerAlert(rule: AlertRule, metrics: SchemaPerformanceMetrics): Promise<void> {
    const alert: SchemaAnalyticsAlert = {
      type: rule.id,
      message: this.formatAlertMessage(rule, metrics),
      severity: rule.severity,
      timestamp: new Date(),
      schemaType: metrics.schemaType,
      metric: this.getPrimaryMetric(metrics, rule),
      threshold: this.getThresholdValue(rule),
      currentValue: this.getCurrentValue(metrics, rule),
    };

    console.log(`Triggering ${rule.severity} alert: ${rule.name} for ${metrics.schemaType}`);

    // Send to configured channels
    const channelPromises = rule.channels.map((channel) => this.sendAlert(channel, alert, rule));

    await Promise.allSettled(channelPromises);

    // Log alert to PROJECT_MEMORY.md (in production this would be a proper logging system)
    await this.logAlert(alert);
  }

  /**
   * Format alert message with context
   */
  private formatAlertMessage(rule: AlertRule, metrics: SchemaPerformanceMetrics): string {
    let message = `${rule.name}: ${rule.description}\n\n`;
    message += `Schema Type: ${metrics.schemaType}\n`;
    message += `Current Status:\n`;

    switch (rule.id) {
      case "high_error_rate":
        message += `- Error Rate: ${(metrics.schemaQuality.errorRate * 100).toFixed(2)}%\n`;
        message += `- Valid Schemas: ${metrics.schemaQuality.validSchemas}/${metrics.schemaQuality.totalSchemas}\n`;
        break;
      case "low_quality_score":
        message += `- Quality Score: ${metrics.schemaQuality.averageScore}/100\n`;
        message += `- Trend: ${metrics.schemaQuality.improvementTrend >= 0 ? "+" : ""}${metrics.schemaQuality.improvementTrend.toFixed(1)}%\n`;
        break;
      case "ctr_drop":
        message += `- CTR: ${(metrics.performanceImpact.clickThroughRate * 100).toFixed(2)}%\n`;
        message += `- Trend: ${metrics.performanceImpact.trend >= 0 ? "+" : ""}${metrics.performanceImpact.trend.toFixed(1)}%\n`;
        break;
      case "impressions_drop":
        message += `- Impressions: ${metrics.richSnippetMetrics?.impressions.toLocaleString() || "N/A"}\n`;
        message += `- Trend: ${metrics.performanceImpact.trend >= 0 ? "+" : ""}${metrics.performanceImpact.trend.toFixed(1)}%\n`;
        break;
      case "ai_discoverability_low":
        message += `- AI Discovery Rate: ${(metrics.aiDiscoverabilityMetrics.discoveryRate * 100).toFixed(1)}%\n`;
        message += `- Understandability: ${metrics.aiDiscoverabilityMetrics.understandabilityScore}/10\n`;
        break;
      case "ai_understandability_poor":
        message += `- AI Understandability: ${metrics.aiDiscoverabilityMetrics.understandabilityScore}/10\n`;
        message += `- Discovery Rate: ${(metrics.aiDiscoverabilityMetrics.discoveryRate * 100).toFixed(1)}%\n`;
        break;
    }

    message += `\nTimestamp: ${new Date().toISOString()}`;
    return message;
  }

  /**
   * Get primary metric for the alert
   */
  private getPrimaryMetric(metrics: SchemaPerformanceMetrics, rule: AlertRule): string {
    switch (rule.id) {
      case "high_error_rate":
        return "error_rate";
      case "low_quality_score":
        return "quality_score";
      case "ctr_drop":
        return "ctr";
      case "impressions_drop":
        return "impressions";
      case "ai_discoverability_low":
        return "ai_discovery";
      case "ai_understandability_poor":
        return "ai_understandability";
      default:
        return "unknown";
    }
  }

  /**
   * Get threshold value for the alert
   */
  private getThresholdValue(rule: AlertRule): number {
    switch (rule.id) {
      case "high_error_rate":
        return this.config.alertThresholds.errorRate;
      case "low_quality_score":
        return this.config.alertThresholds.qualityScore;
      case "ctr_drop":
        return this.config.alertThresholds.ctr;
      case "impressions_drop":
        return this.config.alertThresholds.impressions;
      case "ai_discoverability_low":
        return this.config.alertThresholds.aiDiscoverability;
      case "ai_understandability_poor":
        return this.config.alertThresholds.aiUnderstandability;
      default:
        return 0;
    }
  }

  /**
   * Get current value for the alert
   */
  private getCurrentValue(metrics: SchemaPerformanceMetrics, rule: AlertRule): number {
    switch (rule.id) {
      case "high_error_rate":
        return metrics.schemaQuality.errorRate;
      case "low_quality_score":
        return metrics.schemaQuality.averageScore;
      case "ctr_drop":
        return metrics.performanceImpact.clickThroughRate;
      case "impressions_drop":
        return metrics.richSnippetMetrics?.impressions || 0;
      case "ai_discoverability_low":
        return metrics.aiDiscoverabilityMetrics.discoveryRate;
      case "ai_understandability_poor":
        return metrics.aiDiscoverabilityMetrics.understandabilityScore / 10;
      default:
        return 0;
    }
  }

  /**
   * Send alert to specific channel
   */
  private async sendAlert(
    channel: string,
    alert: SchemaAnalyticsAlert,
    rule: AlertRule
  ): Promise<void> {
    try {
      switch (channel) {
        case "slack":
          await this.sendSlackAlert(alert, rule);
          break;
        case "email":
          await this.sendEmailAlert(alert, rule);
          break;
        case "webhook":
          await this.sendWebhookAlert(alert, rule);
          break;
        default:
          console.warn(`Unknown alert channel: ${channel}`);
      }
    } catch (error) {
      console.error(`Failed to send ${channel} alert:`, error);
    }
  }

  /**
   * Send alert via Slack
   */
  private async sendSlackAlert(alert: SchemaAnalyticsAlert, rule: AlertRule): Promise<void> {
    if (!this.config.integrations.slack?.enabled) return;

    const webhookUrl = this.config.integrations.slack.webhookUrl;
    const channel = this.config.integrations.slack.channel;

    const slackMessage = {
      channel: channel,
      username: "Schema Monitor",
      icon_emoji: this.getSeverityEmoji(alert.severity),
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          title: `${rule.name} - ${alert.severity.toUpperCase()}`,
          text: alert.message,
          fields: [
            {
              title: "Schema Type",
              value: alert.schemaType || "Unknown",
              short: true,
            },
            {
              title: "Severity",
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: "Triggered",
              value: alert.timestamp.toISOString(),
              short: true,
            },
          ],
          ts: Math.floor(alert.timestamp.getTime() / 1000),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status}`);
    }
  }

  /**
   * Send alert via Email
   */
  private async sendEmailAlert(alert: SchemaAnalyticsAlert, rule: AlertRule): Promise<void> {
    if (!this.config.integrations.email?.enabled) return;

    // This would integrate with an email service like SendGrid, AWS SES, or similar
    // For now, just log the email that would be sent
    console.log("Email alert would be sent:", {
      to: this.config.integrations.email.recipients,
      subject: `[${alert.severity.toUpperCase()}] ${rule.name} - Schema Alert`,
      body: alert.message,
    });
  }

  /**
   * Send alert via Webhook
   */
  private async sendWebhookAlert(alert: SchemaAnalyticsAlert, rule: AlertRule): Promise<void> {
    if (!this.config.integrations.webhook?.enabled) return;

    const webhookUrl = this.config.integrations.webhook.url;
    const payload = {
      alert: alert,
      rule: rule,
      timestamp: alert.timestamp.toISOString(),
      source: "schema-monitoring",
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.config.integrations.webhook.secret && {
          "X-Webhook-Secret": this.config.integrations.webhook.secret,
        }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }
  }

  /**
   * Send system-level alert
   */
  private async sendSystemAlert(alert: SchemaAnalyticsAlert): Promise<void> {
    const systemRule: AlertRule = {
      id: "system",
      name: "System Alert",
      description: "System-level monitoring issue",
      condition: () => true,
      severity: "high",
      channels: ["slack", "email"],
      cooldown: 30,
    };

    // Send to all available channels
    const channelPromises = ["slack", "email"].map((channel) =>
      this.sendAlert(channel, alert, systemRule)
    );

    await Promise.allSettled(channelPromises);
  }

  /**
   * Log alert to project memory (placeholder for proper logging system)
   */
  private async logAlert(alert: SchemaAnalyticsAlert): Promise<void> {
    // In production, this would write to a proper logging system
    console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
  }

  /**
   * Get severity emoji for Slack
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case "critical":
        return ":rotating_light:";
      case "high":
        return ":warning:";
      case "medium":
        return ":exclamation:";
      case "low":
        return ":information_source:";
      default:
        return ":question:";
    }
  }

  /**
   * Get severity color for Slack
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case "critical":
        return "#FF0000";
      case "high":
        return "#FF8C00";
      case "medium":
        return "#FFD700";
      case "low":
        return "#32CD32";
      default:
        return "#808080";
    }
  }

  /**
   * Get current monitoring status
   */
  getStatus(): {
    isMonitoring: boolean;
    checkInterval: number;
    alertRules: number;
    lastCheck?: Date;
  } {
    return {
      isMonitoring: this.isMonitoring,
      checkInterval: this.config.checkInterval,
      alertRules: this.alertRules.length,
      lastCheck: schemaAnalytics["lastUpdate"],
    };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart monitoring if configuration changed significantly
    if (newConfig.enabled !== undefined || newConfig.checkInterval !== undefined) {
      if (this.isMonitoring) {
        this.stopMonitoring();
        // Note: In a real implementation, you'd want to restart with new config
        // For now, just log that restart is needed
        console.log(
          "Monitoring configuration updated - restart required for new settings to take effect"
        );
      }
    }
  }
}

// Export singleton instance
export const schemaMonitoring = new SchemaMonitoringService({
  enabled: true,
  checkInterval: 60, // Check every hour
  alertThresholds: {
    ctr: 0.05, // 5% CTR threshold
    impressions: 1000, // 1000 minimum impressions
    errorRate: 0.1, // 10% error rate threshold
    qualityScore: 75, // 75/100 quality score threshold
    ctrTrend: 20, // 20% CTR trend threshold
    impressionsTrend: 25, // 25% impressions trend threshold
    qualityTrend: 15, // 15% quality trend threshold
    aiDiscoverability: 0.7, // 70% AI discoverability threshold
    aiUnderstandability: 0.6, // 60% AI understandability threshold (6/10)
  },
  integrations: {
    slack: {
      enabled: false, // Disabled by default
      webhookUrl: process.env.SLACK_WEBHOOK_URL || "",
      channel: "#schema-monitoring",
    },
    email: {
      enabled: false, // Disabled by default
      smtpConfig: {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.SMTP_USER || "",
          pass: process.env.SMTP_PASS || "",
        },
      },
      recipients: (process.env.ALERT_EMAIL_RECIPIENTS || "").split(",").filter(Boolean),
    },
    webhook: {
      enabled: false, // Disabled by default
      url: process.env.ALERT_WEBHOOK_URL || "",
      secret: process.env.ALERT_WEBHOOK_SECRET,
    },
  },
});
