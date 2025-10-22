/**
 * Data Import Service
 * 
 * Handles bulk import of data from CSV/Excel files
 * Supports: Users, Projects, TRAs, Templates, Hazards
 * 
 * Features:
 * - CSV and Excel file parsing
 * - Data validation before import
 * - Batch operations with progress tracking
 * - Error handling and reporting
 * - Dry-run mode for validation
 */

import * as admin from 'firebase-admin';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

export interface ImportOptions {
  organizationId: string;
  dryRun?: boolean;
  batchSize?: number;
  onProgress?: (progress: ImportProgress) => void;
}

export interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface ImportResult {
  success: boolean;
  progress: ImportProgress;
  summary: {
    total: number;
    imported: number;
    skipped: number;
    failed: number;
  };
}

/**
 * Base importer class with common functionality
 */
abstract class BaseImporter<T extends object> {
  protected db: admin.firestore.Firestore;
  protected options: ImportOptions;

  constructor(options: ImportOptions) {
    this.db = admin.firestore();
    this.options = options;
  }

  /**
   * Parse CSV file content
   */
  protected parseCSV(content: string): any[] {
    return parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: true,
      cast_date: true
    });
  }

  /**
   * Parse Excel file buffer
   */
  protected parseExcel(buffer: Buffer, sheetName?: string): any[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = sheetName 
      ? workbook.Sheets[sheetName]
      : workbook.Sheets[workbook.SheetNames[0]];
    
    return XLSX.utils.sheet_to_json(sheet);
  }

  /**
   * Validate and transform row data
   */
  protected abstract validateRow(row: any, index: number): T | ImportError;

  /**
   * Import single record
   */
  protected abstract importRecord(data: T): Promise<void>;

  /**
   * Import data from parsed rows
   */
  async import(rows: any[]): Promise<ImportResult> {
    const progress: ImportProgress = {
      total: rows.length,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    const batchSize = this.options.batchSize || 50;
    const validRecords: T[] = [];

    // Validate all rows first
    for (let i = 0; i < rows.length; i++) {
      const result = this.validateRow(rows[i], i + 1);
      
      if ('message' in result) {
        // Validation error
        progress.errors.push(result as ImportError);
        progress.failed++;
      } else {
        validRecords.push(result as T);
      }
    }

    // If dry-run, return validation results
    if (this.options.dryRun) {
      return {
        success: progress.failed === 0,
        progress,
        summary: {
          total: rows.length,
          imported: 0,
          skipped: validRecords.length,
          failed: progress.failed
        }
      };
    }

    // Import valid records in batches
    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (record, batchIndex) => {
          try {
            await this.importRecord(record);
            progress.successful++;
          } catch (error) {
            progress.failed++;
            progress.errors.push({
              row: i + batchIndex + 1,
              message: error instanceof Error ? error.message : 'Import failed',
              data: record
            });
          }
          
          progress.processed++;
          
          if (this.options.onProgress) {
            this.options.onProgress(progress);
          }
        })
      );
    }

    return {
      success: progress.failed === 0,
      progress,
      summary: {
        total: rows.length,
        imported: progress.successful,
        skipped: 0,
        failed: progress.failed
      }
    };
  }
}

/**
 * User importer
 */
export class UserImporter extends BaseImporter<{
  email: string;
  displayName: string;
  role: 'admin' | 'safety_manager' | 'supervisor' | 'field_worker';
  phoneNumber?: string;
}> {
  protected validateRow(row: any, index: number) {
    const errors: string[] = [];

    if (!row.email || typeof row.email !== 'string') {
      errors.push('Email is required');
    }

    if (!row.displayName || typeof row.displayName !== 'string') {
      errors.push('Display name is required');
    }

    const validRoles = ['admin', 'safety_manager', 'supervisor', 'field_worker'];
    if (!row.role || !validRoles.includes(row.role)) {
      errors.push(`Role must be one of: ${validRoles.join(', ')}`);
    }

    if (errors.length > 0) {
      return {
        row: index,
        message: errors.join('; ')
      };
    }

    return {
      email: row.email.toLowerCase().trim(),
      displayName: row.displayName.trim(),
      role: row.role,
      phoneNumber: row.phoneNumber?.trim()
    };
  }

  protected async importRecord(data: any): Promise<void> {
    // Create user invitation
    const invitationRef = this.db.collection('invitations').doc();
    
    await invitationRef.set({
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      organizationId: this.options.organizationId,
      status: 'pending',
      createdAt: admin.firestore.Timestamp.now(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      ),
      phoneNumber: data.phoneNumber
    });
  }
}

/**
 * Project importer
 */
export class ProjectImporter extends BaseImporter<{
  name: string;
  description?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  status: 'planning' | 'active' | 'completed' | 'on_hold';
}> {
  protected validateRow(row: any, index: number) {
    const errors: string[] = [];

    if (!row.name || typeof row.name !== 'string') {
      errors.push('Project name is required');
    }

    const validStatuses = ['planning', 'active', 'completed', 'on_hold'];
    if (row.status && !validStatuses.includes(row.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    if (errors.length > 0) {
      return {
        row: index,
        message: errors.join('; ')
      };
    }

    return {
      name: row.name.trim(),
      description: row.description?.trim(),
      location: row.location?.trim(),
      startDate: row.startDate ? new Date(row.startDate) : undefined,
      endDate: row.endDate ? new Date(row.endDate) : undefined,
      status: row.status || 'planning'
    };
  }

  protected async importRecord(data: any): Promise<void> {
    const projectRef = this.db.collection('projects').doc();
    
    await projectRef.set({
      ...data,
      organizationId: this.options.organizationId,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      startDate: data.startDate ? admin.firestore.Timestamp.fromDate(data.startDate) : null,
      endDate: data.endDate ? admin.firestore.Timestamp.fromDate(data.endDate) : null,
      members: [],
      traCount: 0
    });
  }
}

/**
 * Hazard importer
 */
export class HazardImporter extends BaseImporter<{
  name: string;
  category: string;
  description?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  industry?: string[];
}> {
  protected validateRow(row: any, index: number) {
    const errors: string[] = [];

    if (!row.name || typeof row.name !== 'string') {
      errors.push('Hazard name is required');
    }

    if (!row.category || typeof row.category !== 'string') {
      errors.push('Category is required');
    }

    const validRiskLevels = ['low', 'medium', 'high', 'critical'];
    if (row.riskLevel && !validRiskLevels.includes(row.riskLevel)) {
      errors.push(`Risk level must be one of: ${validRiskLevels.join(', ')}`);
    }

    if (errors.length > 0) {
      return {
        row: index,
        message: errors.join('; ')
      };
    }

    return {
      name: row.name.trim(),
      category: row.category.trim(),
      description: row.description?.trim(),
      riskLevel: row.riskLevel || 'medium',
      industry: row.industry ? row.industry.split(',').map((i: string) => i.trim()) : []
    };
  }

  protected async importRecord(data: any): Promise<void> {
    const hazardRef = this.db.collection('hazards').doc();
    
    await hazardRef.set({
      ...data,
      organizationId: this.options.organizationId,
      createdAt: admin.firestore.Timestamp.now(),
      isCustom: true
    });
  }
}

/**
 * Main import service
 */
export class DataImporter {
  /**
   * Import users from CSV/Excel
   */
  static async importUsers(
    file: Buffer | string,
    options: ImportOptions
  ): Promise<ImportResult> {
    const importer = new UserImporter(options);
    const rows = typeof file === 'string' 
      ? importer['parseCSV'](file)
      : importer['parseExcel'](file);
    
    return importer.import(rows);
  }

  /**
   * Import projects from CSV/Excel
   */
  static async importProjects(
    file: Buffer | string,
    options: ImportOptions
  ): Promise<ImportResult> {
    const importer = new ProjectImporter(options);
    const rows = typeof file === 'string'
      ? importer['parseCSV'](file)
      : importer['parseExcel'](file);
    
    return importer.import(rows);
  }

  /**
   * Import hazards from CSV/Excel
   */
  static async importHazards(
    file: Buffer | string,
    options: ImportOptions
  ): Promise<ImportResult> {
    const importer = new HazardImporter(options);
    const rows = typeof file === 'string'
      ? importer['parseCSV'](file)
      : importer['parseExcel'](file);
    
    return importer.import(rows);
  }
}
