/**
 * ERP Integration Framework - Base Connector
 *
 * This module provides a base ERP connector implementation that can be extended
 * for specific ERP systems. It includes common patterns for authentication,
 * data fetching, error handling, and rate limiting.
 */

import {
  ERPConnector,
  ERPConnectionConfig,
  ERPSystem,
  ERPEntity,
  ERPError,
  DataMapping,
} from "../types/integration";

export abstract class BaseERPConnector implements ERPConnector {
  protected config: ERPConnectionConfig;
  protected accessToken?: string;
  protected tokenExpiry?: Date;

  constructor(config: ERPConnectionConfig) {
    this.config = config;
  }

  abstract get name(): string;
  abstract get erpSystem(): ERPSystem;
  abstract get version(): string;
  abstract get description(): string;

  /**
   * Get available entities for this ERP system
   */
  abstract getAvailableEntities(): ERPEntity[];

  /**
   * Get entity schema for field mapping
   */
  abstract getEntitySchema(entity: ERPEntity): Promise<{
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      description?: string;
    }>;
  }>;

  /**
   * Test connection to ERP system
   */
  async testConnection(
    config: ERPConnectionConfig
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.validateCredentials(config);
      return { success: true, message: "Connection successful" };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Validate ERP credentials
   */
  async validateCredentials(config: ERPConnectionConfig): Promise<boolean> {
    try {
      if (config.oauth) {
        await this.authenticateWithOAuth(config.oauth);
      } else if (config.username && config.password) {
        await this.authenticateWithCredentials(config.username, config.password);
      } else if (config.apiKey) {
        await this.authenticateWithApiKey(config.apiKey);
      } else {
        throw new Error("No valid authentication method provided");
      }
      return true;
    } catch (error) {
      console.error("Credential validation failed:", error);
      return false;
    }
  }

  /**
   * Fetch data from ERP system
   */
  async fetchFromERP(entity: ERPEntity, params?: any): Promise<any[]> {
    const endpoint = this.getEntityEndpoint(entity);
    const response = await this.makeAuthenticatedRequest(endpoint, "GET", params);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${entity}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseEntityData(entity, data);
  }

  /**
   * Send data to ERP system
   */
  async sendToERP(
    entity: ERPEntity,
    data: any[]
  ): Promise<{ success: boolean; errors?: ERPError[] }> {
    const errors: ERPError[] = [];

    for (const record of data) {
      try {
        const endpoint = this.getEntityEndpoint(entity);
        const response = await this.makeAuthenticatedRequest(endpoint, "POST", record);

        if (!response.ok) {
          errors.push({
            timestamp: new Date(),
            type: "data_validation",
            code: `HTTP_${response.status}`,
            message: `Failed to send ${entity} record: ${response.statusText}`,
            critical: false,
            retryCount: 0,
          });
        }
      } catch (error) {
        errors.push({
          timestamp: new Date(),
          type: "system_error",
          code: "SEND_FAILED",
          message: `Error sending ${entity} record: ${error instanceof Error ? error.message : "Unknown error"}`,
          critical: false,
          retryCount: 0,
        });
      }
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get rate limiting information for this ERP system
   */
  abstract getRateLimits(): {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };

  /**
   * Authenticate using OAuth
   */
  protected async authenticateWithOAuth(
    oauthConfig: NonNullable<ERPConnectionConfig["oauth"]>
  ): Promise<void> {
    const tokenResponse = await fetch(oauthConfig.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: oauthConfig.clientId,
        client_secret: oauthConfig.clientSecret,
        scope: oauthConfig.scope || "",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`OAuth authentication failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    this.accessToken = tokenData.access_token;
    this.tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
  }

  /**
   * Authenticate using username/password
   */
  protected async authenticateWithCredentials(username: string, password: string): Promise<void> {
    // Implementation depends on specific ERP system
    // This is a placeholder that should be overridden by specific connectors
    throw new Error("Username/password authentication not implemented for this ERP system");
  }

  /**
   * Authenticate using API key
   */
  protected async authenticateWithApiKey(apiKey: string): Promise<void> {
    // Implementation depends on specific ERP system
    // This is a placeholder that should be overridden by specific connectors
    throw new Error("API key authentication not implemented for this ERP system");
  }

  /**
   * Make authenticated HTTP request with retry logic and rate limiting
   */
  protected async makeAuthenticatedRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    data?: any
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;

    // Check if token needs refresh
    if (this.tokenExpiry && this.tokenExpiry <= new Date()) {
      if (this.config.oauth) {
        await this.authenticateWithOAuth(this.config.oauth);
      }
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...this.config.headers,
    };

    // Add authentication headers
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    };

    if (data && (method === "POST" || method === "PUT")) {
      requestOptions.body = JSON.stringify(data);
    }

    return await this.makeRequestWithRetry(url, requestOptions);
  }

  /**
   * Make HTTP request with exponential backoff retry
   */
  private async makeRequestWithRetry(
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<Response> {
    const retryConfig = this.config.retryConfig || {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 30000,
    };

    try {
      const response = await fetch(url, options);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const delay = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.min(retryConfig.initialDelay * Math.pow(2, retryCount), retryConfig.maxDelay);

        if (retryCount < retryConfig.maxRetries) {
          await this.delay(delay);
          return this.makeRequestWithRetry(url, options, retryCount + 1);
        }
      }

      return response;
    } catch (error) {
      if (retryCount < retryConfig.maxRetries) {
        const delay = Math.min(
          retryConfig.initialDelay * Math.pow(2, retryCount),
          retryConfig.maxDelay
        );
        await this.delay(delay);
        return this.makeRequestWithRetry(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Get entity-specific endpoint
   */
  protected abstract getEntityEndpoint(entity: ERPEntity): string;

  /**
   * Parse ERP-specific response data
   */
  protected abstract parseEntityData(entity: ERPEntity, data: any): any[];

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Transform data using field mappings
   */
  protected transformData(data: any[], mappings: DataMapping[]): any[] {
    return data.map((record) => {
      const transformed: any = {};

      for (const mapping of mappings) {
        const sourceValue = this.getNestedValue(record, mapping.sourceField);

        if (sourceValue !== undefined) {
          let targetValue = sourceValue;

          // Apply transformation if specified
          if (mapping.transformation?.transformFunction) {
            try {
              const transformFn = new Function(
                "value",
                "record",
                mapping.transformation!.transformFunction!
              );
              targetValue = transformFn(sourceValue, record);
            } catch (error) {
              console.error(`Error transforming field ${mapping.targetField}:`, error);
            }
          }

          this.setNestedValue(transformed, mapping.targetField, targetValue);
        } else if (mapping.transformation?.defaultValue !== undefined) {
          this.setNestedValue(
            transformed,
            mapping.targetField,
            mapping.transformation.defaultValue
          );
        }
      }

      return transformed;
    });
  }

  /**
   * Get nested object value using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested object value using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}

/**
 * Generic ERP Connector for systems without specific implementations
 */
export class GenericERPConnector extends BaseERPConnector {
  get name(): string {
    return "Generic ERP Connector";
  }

  get erpSystem(): ERPSystem {
    return "generic";
  }

  get version(): string {
    return "1.0.0";
  }

  get description(): string {
    return "Generic ERP connector that can be adapted for various ERP systems";
  }

  getAvailableEntities(): ERPEntity[] {
    return ["customers", "projects", "employees", "invoices"];
  }

  async getEntitySchema(entity: ERPEntity): Promise<{
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      description?: string;
    }>;
  }> {
    // Generic schema - should be overridden for specific ERP systems
    const schemas: Record<ERPEntity, any> = {
      customers: {
        fields: [
          {
            name: "CustomerID",
            type: "string",
            required: true,
            description: "Unique customer identifier",
          },
          { name: "CustomerName", type: "string", required: true, description: "Customer name" },
          { name: "Email", type: "string", required: false, description: "Customer email address" },
          { name: "Phone", type: "string", required: false, description: "Customer phone number" },
          { name: "Address", type: "string", required: false, description: "Customer address" },
        ],
      },
      projects: {
        fields: [
          {
            name: "ProjectID",
            type: "string",
            required: true,
            description: "Unique project identifier",
          },
          { name: "ProjectName", type: "string", required: true, description: "Project name" },
          {
            name: "CustomerID",
            type: "string",
            required: false,
            description: "Associated customer ID",
          },
          { name: "StartDate", type: "date", required: false, description: "Project start date" },
          { name: "EndDate", type: "date", required: false, description: "Project end date" },
          { name: "Status", type: "string", required: false, description: "Project status" },
        ],
      },
      employees: {
        fields: [
          {
            name: "EmployeeID",
            type: "string",
            required: true,
            description: "Unique employee identifier",
          },
          { name: "FirstName", type: "string", required: true, description: "Employee first name" },
          { name: "LastName", type: "string", required: true, description: "Employee last name" },
          { name: "Email", type: "string", required: false, description: "Employee email address" },
          {
            name: "Department",
            type: "string",
            required: false,
            description: "Employee department",
          },
        ],
      },
      invoices: {
        fields: [
          {
            name: "InvoiceID",
            type: "string",
            required: true,
            description: "Unique invoice identifier",
          },
          {
            name: "CustomerID",
            type: "string",
            required: true,
            description: "Associated customer ID",
          },
          { name: "Amount", type: "number", required: true, description: "Invoice amount" },
          { name: "Date", type: "date", required: true, description: "Invoice date" },
          { name: "Status", type: "string", required: false, description: "Invoice status" },
        ],
      },
      purchase_orders: { fields: [] },
      inventory: { fields: [] },
      financial_data: { fields: [] },
      time_entries: { fields: [] },
      equipment: { fields: [] },
    };

    return schemas[entity] || { fields: [] };
  }

  getRateLimits(): {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  } {
    return {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
    };
  }

  protected async authenticateWithCredentials(username: string, password: string): Promise<void> {
    // Generic basic auth implementation
    const response = await fetch(`${this.config.baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const authData = await response.json();
    this.accessToken = authData.token;
  }

  protected async authenticateWithApiKey(apiKey: string): Promise<void> {
    // Generic API key authentication
    this.config.headers = {
      ...this.config.headers,
      "X-API-Key": apiKey,
      Authorization: `Bearer ${apiKey}`,
    };
  }

  protected getEntityEndpoint(entity: ERPEntity): string {
    const endpoints: Record<ERPEntity, string> = {
      customers: "/api/customers",
      projects: "/api/projects",
      employees: "/api/employees",
      invoices: "/api/invoices",
      purchase_orders: "/api/purchase-orders",
      inventory: "/api/inventory",
      financial_data: "/api/financial-data",
      time_entries: "/api/time-entries",
      equipment: "/api/equipment",
    };

    return endpoints[entity] || "/api/generic";
  }

  protected parseEntityData(entity: ERPEntity, data: any): any[] {
    // Generic data parsing - assumes standard REST API response format
    if (Array.isArray(data)) {
      return data;
    }

    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    }

    if (data && data.items && Array.isArray(data.items)) {
      return data.items;
    }

    // If it's a single object, wrap it in an array
    if (data && typeof data === "object") {
      return [data];
    }

    return [];
  }
}

/**
 * Factory function to create ERP connectors
 */
export function createERPConnector(config: ERPConnectionConfig): ERPConnector {
  // In a real implementation, this would return specific connectors based on the ERP system
  // For now, return the generic connector as a starting point
  return new GenericERPConnector(config);
}
