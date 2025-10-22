/**
 * Data Export Service
 * 
 * Handles bulk export of data to CSV/Excel files
 * Supports: Users, Projects, TRAs, LMRA Sessions, Hazards
 * 
 * Features:
 * - CSV and Excel file generation
 * - Customizable field selection
 * - Batch processing for large datasets
 * - Progress tracking
 * - Multiple export formats
 */

import * as admin from 'firebase-admin';
import { stringify } from 'csv-stringify';
import * as XLSX from 'xlsx';

export interface ExportOptions {
  organizationId: string;
  format: 'csv' | 'excel';
  fields?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  onProgress?: (progress: ExportProgress) => void;
}

export interface ExportProgress {
  total: number;
  processed: number;
  percentage: number;
}

export interface ExportResult {
  success: boolean;
  data: Buffer | string;
  filename: string;
  recordCount: number;
  format: 'csv' | 'excel';
}

/**
 * Base exporter class with common functionality
 */
abstract class BaseExporter<T> {
  protected db: admin.firestore.Firestore;
  protected options: ExportOptions;

  constructor(options: ExportOptions) {
    this.db = admin.firestore();
    this.options = options;
  }

  /**
   * Get collection query with filters
   */
  protected abstract getQuery(): admin.firestore.Query;

  /**
   * Transform Firestore document to export record
   */
  protected abstract transformRecord(doc: admin.firestore.DocumentSnapshot): T;

  /**
   * Get field names for export
   */
  protected abstract getFields(): string[];

  /**
   * Generate CSV from records
   */
  protected async generateCSV(records: T[]): Promise<string> {
    const fields = this.options.fields || this.getFields();
    
    return new Promise((resolve, reject) => {
      stringify(records, {
        header: true,
        columns: fields,
        cast: {
          date: (value: any) => value?.toISOString() || ''
        }
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });
  }

  /**
   * Generate Excel from records
   */
  protected generateExcel(records: T[], sheetName: string = 'Export'): Buffer {
    const fields = this.options.fields || this.getFields();
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(records, {
      header: fields
    });
    
    // Auto-size columns
    const maxWidth = 50;
    const colWidths = fields.map(field => {
      const maxLength = Math.max(
        field.length,
        ...records.map(r => String((r as any)[field] || '').length)
      );
      return { wch: Math.min(maxLength + 2, maxWidth) };
    });
    worksheet['!cols'] = colWidths;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Export data
   */
  async export(): Promise<ExportResult> {
    const query = this.getQuery();
    const snapshot = await query.get();
    
    const total = snapshot.size;
    const progress: ExportProgress = {
      total,
      processed: 0,
      percentage: 0
    };
    
    // Transform documents
    const records: T[] = [];
    for (const doc of snapshot.docs) {
      records.push(this.transformRecord(doc));
      progress.processed++;
      progress.percentage = Math.round((progress.processed / total) * 100);
      
      if (this.options.onProgress) {
        this.options.onProgress(progress);
      }
    }
    
    // Generate export file
    const timestamp = new Date().toISOString().split('T')[0];
    const data = this.options.format === 'csv'
      ? await this.generateCSV(records)
      : this.generateExcel(records);
    
    const extension = this.options.format === 'csv' ? 'csv' : 'xlsx';
    const filename = `export-${timestamp}.${extension}`;
    
    return {
      success: true,
      data,
      filename,
      recordCount: records.length,
      format: this.options.format
    };
  }
}

/**
 * User exporter
 */
export class UserExporter extends BaseExporter<{
  email: string;
  displayName: string;
  role: string;
  phoneNumber?: string;
  createdAt: string;
  lastLogin?: string;
}> {
  protected getQuery() {
    let query: admin.firestore.Query = this.db
      .collection('users')
      .where('organizationId', '==', this.options.organizationId);
    
    if (this.options.dateRange) {
      query = query
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(this.options.dateRange.start))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(this.options.dateRange.end));
    }
    
    return query;
  }

  protected transformRecord(doc: admin.firestore.DocumentSnapshot) {
    const data = doc.data()!;
    return {
      email: data.email || '',
      displayName: data.displayName || '',
      role: data.roles?.[0] || 'field_worker',
      phoneNumber: data.phoneNumber,
      createdAt: data.createdAt?.toDate().toISOString() || '',
      lastLogin: data.lastLogin?.toDate().toISOString()
    };
  }

  protected getFields() {
    return ['email', 'displayName', 'role', 'phoneNumber', 'createdAt', 'lastLogin'];
  }
}

/**
 * Project exporter
 */
export class ProjectExporter extends BaseExporter<{
  name: string;
  description?: string;
  location?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  traCount: number;
  memberCount: number;
  createdAt: string;
}> {
  protected getQuery() {
    let query: admin.firestore.Query = this.db
      .collection('projects')
      .where('organizationId', '==', this.options.organizationId);
    
    if (this.options.filters?.status) {
      query = query.where('status', '==', this.options.filters.status);
    }
    
    return query;
  }

  protected transformRecord(doc: admin.firestore.DocumentSnapshot) {
    const data = doc.data()!;
    return {
      name: data.name || '',
      description: data.description,
      location: data.location,
      status: data.status || 'planning',
      startDate: data.startDate?.toDate().toISOString(),
      endDate: data.endDate?.toDate().toISOString(),
      traCount: data.traCount || 0,
      memberCount: data.members?.length || 0,
      createdAt: data.createdAt?.toDate().toISOString() || ''
    };
  }

  protected getFields() {
    return ['name', 'description', 'location', 'status', 'startDate', 'endDate', 'traCount', 'memberCount', 'createdAt'];
  }
}

/**
 * TRA exporter
 */
export class TRAExporter extends BaseExporter<{
  title: string;
  projectName?: string;
  status: string;
  riskLevel: string;
  createdBy: string;
  createdAt: string;
  approvedAt?: string;
  validUntil?: string;
}> {
  protected getQuery() {
    let query: admin.firestore.Query = this.db
      .collection('tras')
      .where('organizationId', '==', this.options.organizationId);
    
    if (this.options.filters?.status) {
      query = query.where('status', '==', this.options.filters.status);
    }
    
    if (this.options.filters?.projectId) {
      query = query.where('projectId', '==', this.options.filters.projectId);
    }
    
    if (this.options.dateRange) {
      query = query
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(this.options.dateRange.start))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(this.options.dateRange.end));
    }
    
    return query;
  }

  protected transformRecord(doc: admin.firestore.DocumentSnapshot) {
    const data = doc.data()!;
    return {
      title: data.title || '',
      projectName: data.projectName,
      status: data.status || 'draft',
      riskLevel: data.overallRisk?.level || 'low',
      createdBy: data.createdBy || '',
      createdAt: data.createdAt?.toDate().toISOString() || '',
      approvedAt: data.approvedAt?.toDate().toISOString(),
      validUntil: data.validUntil?.toDate().toISOString()
    };
  }

  protected getFields() {
    return ['title', 'projectName', 'status', 'riskLevel', 'createdBy', 'createdAt', 'approvedAt', 'validUntil'];
  }
}

/**
 * LMRA Session exporter
 */
export class LMRASessionExporter extends BaseExporter<{
  traTitle: string;
  projectName?: string;
  assessment: string;
  riskLevel: string;
  location?: string;
  executedBy: string;
  executedAt: string;
  duration?: number;
}> {
  protected getQuery() {
    let query: admin.firestore.Query = this.db
      .collection('lmra-sessions')
      .where('organizationId', '==', this.options.organizationId);
    
    if (this.options.filters?.assessment) {
      query = query.where('assessment', '==', this.options.filters.assessment);
    }
    
    if (this.options.dateRange) {
      query = query
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(this.options.dateRange.start))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(this.options.dateRange.end));
    }
    
    return query;
  }

  protected transformRecord(doc: admin.firestore.DocumentSnapshot) {
    const data = doc.data()!;
    return {
      traTitle: data.traTitle || '',
      projectName: data.projectName,
      assessment: data.assessment || 'safe',
      riskLevel: data.riskLevel || 'low',
      location: data.location?.address,
      executedBy: data.createdBy || '',
      executedAt: data.createdAt?.toDate().toISOString() || '',
      duration: data.duration
    };
  }

  protected getFields() {
    return ['traTitle', 'projectName', 'assessment', 'riskLevel', 'location', 'executedBy', 'executedAt', 'duration'];
  }
}

/**
 * Hazard exporter
 */
export class HazardExporter extends BaseExporter<{
  name: string;
  category: string;
  description?: string;
  riskLevel: string;
  industry: string;
  isCustom: boolean;
}> {
  protected getQuery() {
    return this.db
      .collection('hazards')
      .where('organizationId', '==', this.options.organizationId);
  }

  protected transformRecord(doc: admin.firestore.DocumentSnapshot) {
    const data = doc.data()!;
    return {
      name: data.name || '',
      category: data.category || '',
      description: data.description,
      riskLevel: data.riskLevel || 'medium',
      industry: Array.isArray(data.industry) ? data.industry.join(', ') : '',
      isCustom: data.isCustom || false
    };
  }

  protected getFields() {
    return ['name', 'category', 'description', 'riskLevel', 'industry', 'isCustom'];
  }
}

/**
 * Main export service
 */
export class DataExporter {
  /**
   * Export users
   */
  static async exportUsers(options: ExportOptions): Promise<ExportResult> {
    const exporter = new UserExporter(options);
    return exporter.export();
  }

  /**
   * Export projects
   */
  static async exportProjects(options: ExportOptions): Promise<ExportResult> {
    const exporter = new ProjectExporter(options);
    return exporter.export();
  }

  /**
   * Export TRAs
   */
  static async exportTRAs(options: ExportOptions): Promise<ExportResult> {
    const exporter = new TRAExporter(options);
    return exporter.export();
  }

  /**
   * Export LMRA sessions
   */
  static async exportLMRASessions(options: ExportOptions): Promise<ExportResult> {
    const exporter = new LMRASessionExporter(options);
    return exporter.export();
  }

  /**
   * Export hazards
   */
  static async exportHazards(options: ExportOptions): Promise<ExportResult> {
    const exporter = new HazardExporter(options);
    return exporter.export();
  }
}
