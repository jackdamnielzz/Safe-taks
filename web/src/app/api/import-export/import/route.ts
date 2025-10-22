/**
 * Data Import API
 * POST /api/import-export/import
 */

import { NextRequest, NextResponse } from 'next/server';
import { DataImporter } from '@/lib/import-export/data-importer';
import '@/lib/firebase-admin'; // Initialize admin

export async function POST(request: NextRequest) {
  try {
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string;
    const organizationId = formData.get('organizationId') as string;
    const dryRun = formData.get('dryRun') === 'true';
    
    if (!file || !entityType || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileContent = file.type === 'text/csv' 
      ? fileBuffer.toString('utf-8')
      : fileBuffer;
    
    let result;
    const options = { organizationId, dryRun };
    
    switch (entityType) {
      case 'users':
        result = await DataImporter.importUsers(fileContent, options);
        break;
      case 'projects':
        result = await DataImporter.importProjects(fileContent, options);
        break;
      case 'hazards':
        result = await DataImporter.importHazards(fileContent, options);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid entity type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Import failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
