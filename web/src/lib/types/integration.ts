/**
 * ERP Integration Framework Types
 *
 * Defines the core types and interfaces for integrating with external ERP systems.
 * This framework supports common ERP operations like customer sync, project data exchange,
 * and financial reporting integration.
 */

export type ERPSystem =
  | "sap"
  | "oracle"
  | "microsoft_dynamics"
  | "sage"
  | "quickbooks"
  | "exact"
  | "afas"
  | "visma"
  | "generic";

export type IntegrationStatus = "active" | "inactive" | "error" | "syncing" | "maintenance";

export type SyncDirection = "bidirectional" | "inbound" | "outbound";

export type DataMappingType = "direct" | "transform" | "lookup" | "conditional";

export interface ERPConnectionConfig {
  /** ERP system type */
  system: ERPSystem;
  /** Base URL for ERP API */
  baseUrl: string;
  /** API credentials */
  apiKey?: string;
  username?: string;
  password?: string;
  /** OAuth configuration for modern ERP systems */
  oauth?: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    scope?: string;
  };
  /** Custom headers for authentication */
  headers?: Record<string, string>;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retryConfig?: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
  };
}

export interface DataMapping {
  /** Unique identifier for the mapping */
  id: string;
  /** Source field path (e.g., "projects.name") */
  sourceField: string;
  /** Target field path in ERP (e.g., "ProjectName") */
  targetField: string;
  /** Type of mapping transformation */
  mappingType: DataMappingType;
  /** Transformation rules for complex mappings */
  transformation?: {
    /** JavaScript function as string for data transformation */
    transformFunction?: string;
    /** Default value if source is empty */
    defaultValue?: any;
    /** Validation rules */
    validation?: {
      required?: boolean;
      type?: "string" | "number" | "date" | "boolean";
      minLength?: number;
      maxLength?: number;
      pattern?: string;
    };
  };
  /** Conditional mapping rules */
  conditions?: Array<{
    field: string;
    operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
    value: any;
  }>;
}

export interface ERPIntegration {
  /** Unique identifier for the integration */
  id: string;
  /** Organization ID that owns this integration */
  organizationId: string;
  /** Human-readable name for the integration */
  name: string;
  /** ERP system being integrated with */
  erpSystem: ERPSystem;
  /** Current status of the integration */
  status: IntegrationStatus;
  /** Connection configuration */
  connectionConfig: ERPConnectionConfig;
  /** Data synchronization settings */
  syncSettings: {
    /** Direction of data sync */
    direction: SyncDirection;
    /** Sync frequency in minutes */
    frequency: number;
    /** Whether to enable real-time sync */
    realTimeSync: boolean;
    /** Data entities to synchronize */
    entities: ERPEntity[];
  };
  /** Field mappings for data transformation */
  fieldMappings: Record<string, DataMapping[]>;
  /** Error tracking */
  errors: ERPError[];
  /** Sync statistics */
  stats: ERPSyncStats;
  /** Created timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
  /** Last successful sync timestamp */
  lastSyncAt?: Date;
}

export type ERPEntity =
  | "customers"
  | "projects"
  | "employees"
  | "invoices"
  | "purchase_orders"
  | "inventory"
  | "financial_data"
  | "time_entries"
  | "equipment";

export interface ERPSyncStats {
  /** Total number of successful syncs */
  totalSyncs: number;
  /** Number of failed syncs */
  failedSyncs: number;
  /** Records processed in last sync */
  lastSyncRecords: number;
  /** Average sync duration in milliseconds */
  averageSyncDuration: number;
  /** Last error message if any */
  lastError?: string;
  /** Error count by type */
  errorsByType: Record<string, number>;
}

export interface ERPError {
  /** Error timestamp */
  timestamp: Date;
  /** Error type/category */
  type: "connection" | "authentication" | "data_validation" | "rate_limit" | "system_error";
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Technical details for debugging */
  details?: any;
  /** Whether this error is critical */
  critical: boolean;
  /** Number of retries attempted */
  retryCount: number;
}

export interface ERPSyncResult {
  /** Sync execution ID */
  syncId: string;
  /** Integration ID */
  integrationId: string;
  /** When the sync started */
  startedAt: Date;
  /** When the sync completed */
  completedAt: Date;
  /** Duration of sync in milliseconds */
  duration: number;
  /** Number of records processed */
  recordsProcessed: number;
  /** Number of records successfully synced */
  recordsSynced: number;
  /** Number of records that failed */
  recordsFailed: number;
  /** Sync status */
  status: "success" | "partial_success" | "failed";
  /** Errors encountered during sync */
  errors: ERPError[];
  /** Entity-specific results */
  entityResults: Record<ERPEntity, EntitySyncResult>;
}

export interface EntitySyncResult {
  /** Entity name */
  entity: ERPEntity;
  /** Records processed for this entity */
  recordsProcessed: number;
  /** Records successfully synced */
  recordsSynced: number;
  /** Records that failed */
  recordsFailed: number;
  /** Last successful sync timestamp for this entity */
  lastSyncAt?: Date;
  /** Entity-specific errors */
  errors: ERPError[];
}

export interface ERPConnector {
  /** Connector name */
  name: string;
  /** Supported ERP system */
  erpSystem: ERPSystem;
  /** Connector version */
  version: string;
  /** Description of capabilities */
  description: string;

  /**
   * Test connection to ERP system
   */
  testConnection(config: ERPConnectionConfig): Promise<{ success: boolean; message: string }>;

  /**
   * Get available entities for synchronization
   */
  getAvailableEntities(): ERPEntity[];

  /**
   * Fetch data from ERP system
   */
  fetchFromERP(entity: ERPEntity, params?: any): Promise<any[]>;

  /**
   * Send data to ERP system
   */
  sendToERP(entity: ERPEntity, data: any[]): Promise<{ success: boolean; errors?: ERPError[] }>;

  /**
   * Get schema information for an entity
   */
  getEntitySchema(entity: ERPEntity): Promise<{
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      description?: string;
    }>;
  }>;

  /**
   * Validate ERP credentials
   */
  validateCredentials(config: ERPConnectionConfig): Promise<boolean>;

  /**
   * Get rate limiting information
   */
  getRateLimits(): {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}

// Integration event types for webhook system
export type ERPIntegrationEvent =
  | "integration.created"
  | "integration.updated"
  | "integration.deleted"
  | "integration.error"
  | "sync.started"
  | "sync.completed"
  | "sync.failed"
  | "data.mapped"
  | "connection.lost"
  | "connection.restored";

export interface ERPIntegrationEventData {
  /** Event type */
  eventType: ERPIntegrationEvent;
  /** Integration ID */
  integrationId: string;
  /** Organization ID */
  organizationId: string;
  /** Timestamp of event */
  timestamp: Date;
  /** Event-specific data */
  data: {
    /** For sync events */
    syncResult?: ERPSyncResult;
    /** For error events */
    error?: ERPError;
    /** For data events */
    entity?: ERPEntity;
    /** Additional context */
    metadata?: Record<string, any>;
  };
}
