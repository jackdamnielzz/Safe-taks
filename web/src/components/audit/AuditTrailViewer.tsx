/**
 * Audit Trail Viewer Component
 * Displays audit logs with filtering, timeline view, and export
 * 
 * Features:
 * - Timeline view with event details
 * - Filter by event type, category, severity, date range
 * - User activity tracking
 * - Export to CSV/Excel
 * - Pagination for large datasets
 * - Compliance-focused display
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { 
  AuditLog, 
  AuditEventType, 
  AuditCategory, 
  AuditSeverity 
} from '@/lib/audit/audit-trail';

interface AuditTrailViewerProps {
  /**
   * Organization ID to fetch audit logs for
   */
  organizationId: string;
  
  /**
   * Optional subject filter (e.g., specific TRA ID)
   */
  subjectId?: string;
  
  /**
   * Optional subject type filter
   */
  subjectType?: string;
  
  /**
   * Number of logs to display per page
   */
  pageSize?: number;
  
  /**
   * Whether to show export buttons
   */
  showExport?: boolean;
  
  /**
   * Whether to show filters
   */
  showFilters?: boolean;
}

export function AuditTrailViewer({
  organizationId,
  subjectId,
  subjectType,
  pageSize = 50,
  showExport = true,
  showFilters = true,
}: AuditTrailViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<AuditCategory[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<AuditSeverity[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<AuditEventType[]>([]);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Fetch audit logs
   */
  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          organizationId,
          limit: (pageSize * 2).toString(), // Fetch more for client-side filtering
        });
        
        if (subjectId) params.append('subjectId', subjectId);
        if (subjectType) params.append('subjectType', subjectType);
        if (selectedCategories.length > 0) {
          params.append('categories', selectedCategories.join(','));
        }
        if (selectedSeverities.length > 0) {
          params.append('severities', selectedSeverities.join(','));
        }
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        
        const response = await fetch(`/api/audit-logs?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch audit logs');
        }
        
        const data = await response.json();
        setLogs(data.logs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchLogs();
  }, [
    organizationId,
    subjectId,
    subjectType,
    selectedCategories,
    selectedSeverities,
    dateFrom,
    dateTo,
    pageSize,
  ]);

  /**
   * Filter logs client-side for additional filters
   */
  const filteredLogs = useMemo(() => {
    let filtered = [...logs];
    
    // Event type filter
    if (selectedEventTypes.length > 0) {
      filtered = filtered.filter(log => selectedEventTypes.includes(log.eventType));
    }
    
    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.actorName?.toLowerCase().includes(query) ||
        log.subjectName?.toLowerCase().includes(query) ||
        log.eventType.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [logs, selectedEventTypes, searchQuery]);

  /**
   * Paginate filtered logs
   */
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredLogs.slice(start, end);
  }, [filteredLogs, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  /**
   * Export to CSV
   */
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Event', 'Category', 'Severity', 'Actor', 'Subject', 'Details'];
    const rows = filteredLogs.map(log => [
      formatTimestamp(log.timestamp),
      formatEventType(log.eventType),
      log.category,
      log.severity,
      log.actorName || log.actorId,
      log.subjectName || log.subjectId,
      log.metadata ? JSON.stringify(log.metadata) : '',
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedSeverities([]);
    setSelectedEventTypes([]);
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Audit logs laden...</div>
        </div>
      </Card>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Fout bij laden: {error}</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Trail</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredLogs.length} {filteredLogs.length === 1 ? 'gebeurtenis' : 'gebeurtenissen'}
          </p>
        </div>
        
        {showExport && (
          <div className="flex gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              disabled={filteredLogs.length === 0}
            >
              📥 Export CSV
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
              <Button
                onClick={handleClearFilters}
                variant="outline"
                size="sm"
              >
                Wis filters
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zoeken
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Actor, subject, event..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Van datum
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tot datum
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categorie
                </label>
                <select
                  multiple
                  value={selectedCategories}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value as AuditCategory);
                    setSelectedCategories(values);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  size={3}
                >
                  <option value="tra">TRA</option>
                  <option value="lmra">LMRA</option>
                  <option value="user">Gebruiker</option>
                  <option value="organization">Organisatie</option>
                  <option value="project">Project</option>
                  <option value="compliance">Compliance</option>
                  <option value="security">Beveiliging</option>
                </select>
              </div>
            </div>
            
            {/* Active filters display */}
            {(selectedCategories.length > 0 || selectedSeverities.length > 0 || selectedEventTypes.length > 0 || dateFrom || dateTo || searchQuery) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {selectedCategories.map(cat => (
                  <Badge key={cat} variant="secondary">
                    {cat}
                  </Badge>
                ))}
                {selectedSeverities.map(sev => (
                  <Badge key={sev} variant="secondary">
                    {sev}
                  </Badge>
                ))}
                {dateFrom && <Badge variant="secondary">Vanaf: {dateFrom}</Badge>}
                {dateTo && <Badge variant="secondary">Tot: {dateTo}</Badge>}
                {searchQuery && <Badge variant="secondary">Zoek: "{searchQuery}"</Badge>}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Timeline */}
      <Card className="p-6">
        {paginatedLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Geen audit logs gevonden voor de geselecteerde filters.
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedLogs.map((log, index) => (
              <AuditLogEntry key={log.id || index} log={log} />
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Pagina {currentPage} van {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Vorige
            </Button>
            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Volgende
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual audit log entry component
 */
function AuditLogEntry({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border-l-4 pl-4 py-3" style={{ borderColor: getSeverityColor(log.severity) }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">
              {formatEventType(log.eventType)}
            </span>
            <Badge variant={getCategoryVariant(log.category)}>
              {log.category}
            </Badge>
            <Badge variant={getSeverityVariant(log.severity)}>
              {log.severity}
            </Badge>
            {log.complianceRelevant && (
              <Badge variant="success">Compliance</Badge>
            )}
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <div>
              <span className="font-medium">Actor:</span> {log.actorName || log.actorId}
              {log.actorRole && ` (${log.actorRole})`}
            </div>
            <div>
              <span className="font-medium">Subject:</span> {log.subjectName || log.subjectId}
              {` (${log.subjectType})`}
            </div>
            <div className="text-xs text-gray-500">
              {formatTimestamp(log.timestamp)}
            </div>
          </div>
          
          {/* Changes */}
          {log.changes && log.changes.length > 0 && (
            <div className="mt-2 text-sm">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {expanded ? '▼' : '▶'} {log.changes.length} wijziging(en)
              </button>
              {expanded && (
                <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200">
                  {log.changes.map((change, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="font-medium">{change.field}:</span>{' '}
                      <span className="text-red-600 line-through">{String(change.oldValue)}</span>
                      {' → '}
                      <span className="text-green-600">{String(change.newValue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                {expanded ? '▼' : '▶'} Details
              </button>
              {expanded && (
                <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper functions
 */

function formatTimestamp(timestamp: any): string {
  const date = timestamp instanceof Date ? timestamp : timestamp.toDate?.() || new Date(timestamp);
  return new Intl.DateTimeFormat('nl-NL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function formatEventType(eventType: string): string {
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getSeverityColor(severity: AuditSeverity): string {
  const colors: Record<AuditSeverity, string> = {
    info: '#3B82F6',
    warning: '#F59E0B',
    error: '#EF4444',
    critical: '#DC2626',
  };
  return colors[severity];
}

function getSeverityVariant(severity: AuditSeverity): 'default' | 'secondary' | 'success' | 'warning' | 'error' {
  const variants: Record<AuditSeverity, 'default' | 'secondary' | 'success' | 'warning' | 'error'> = {
    info: 'default',
    warning: 'warning',
    error: 'error',
    critical: 'error',
  };
  return variants[severity];
}

function getCategoryVariant(category: AuditCategory): 'default' | 'secondary' | 'success' | 'warning' | 'error' {
  const variants: Record<AuditCategory, 'default' | 'secondary' | 'success' | 'warning' | 'error'> = {
    tra: 'default',
    lmra: 'default',
    user: 'secondary',
    organization: 'secondary',
    project: 'default',
    template: 'secondary',
    report: 'secondary',
    compliance: 'success',
    security: 'error',
  };
  return variants[category];
}