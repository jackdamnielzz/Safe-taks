/**
 * Data Export API
 * GET /api/import-export/export
 */

import { NextRequest, NextResponse } from 'next/server';
import { DataExporter } from '@/lib/import-export/data-exporter';
import '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const organizationId = searchParams.get('organizationId');
    const format = (searchParams.get('format') || 'csv') as 'csv' | 'excel';
    
    if (!entityType || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const options = { organizationId, format };
    let result;
    
    switch (entityType) {
      case 'users':
        result = await DataExporter.exportUsers(options);
        break;
      case 'projects':
        result = await DataExporter.exportProjects(options);
        break;
      case 'tras':
        result = await DataExporter.exportTRAs(options);
        break;
      case 'lmra-sessions':
        result = await DataExporter.exportLMRASessions(options);
        break;
      case 'hazards':
        result = await DataExporter.exportHazards(options);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid entity type' },
          { status: 400 }
        );
    }
    
    const contentType = format === 'csv' 
      ? 'text/csv'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
    // Convert Buffer to Uint8Array for NextResponse
    const responseData = typeof result.data === 'string' 
      ? result.data 
      : new Uint8Array(result.data);
    
    return new NextResponse(responseData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
