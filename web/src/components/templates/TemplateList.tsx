'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { TraTemplate } from '@/types/tra-template';
import { Badge } from '@/components/ui/Badge';
import { ChevronUp, ChevronDown, Eye, Edit, Trash2 } from 'lucide-react';

interface TemplateListProps {
  templates: TraTemplate[];
  onView?: (template: TraTemplate) => void;
  onEdit?: (template: TraTemplate) => void;
  onDelete?: (template: TraTemplate) => void;
  isLoading?: boolean;
}

type SortField = 'name' | 'industry' | 'hazards' | 'steps';
type SortOrder = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export default function TemplateList({
  templates,
  onView,
  onEdit,
  onDelete,
  isLoading = false,
}: TemplateListProps) {
  const t = useTranslations();
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'name',
    order: 'asc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const sortedTemplates = useMemo(() => {
    const sorted = [...templates].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortConfig.field) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'industry':
          aValue = a.industry;
          bValue = b.industry;
          break;
        case 'hazards':
          aValue = a.hazards.length;
          bValue = b.hazards.length;
          break;
        case 'steps':
          aValue = a.steps.length;
          bValue = b.steps.length;
          break;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.order === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.order === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [templates, sortConfig]);

  const paginatedTemplates = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedTemplates.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTemplates, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedTemplates.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) {
      return <div className="h-4 w-4" />;
    }
    return sortConfig.order === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">{t('templates.list.loading')}</div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 py-12 text-center">
        <p className="text-gray-600">{t('templates.list.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-600">
          {t('templates.list.showing', {
            start: (currentPage - 1) * itemsPerPage + 1,
            end: Math.min(currentPage * itemsPerPage, sortedTemplates.length),
            total: sortedTemplates.length,
          })}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">
            {t('templates.list.itemsPerPage')}:
          </label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 font-semibold text-gray-900 hover:text-gray-700"
                >
                  {t('templates.list.name')}
                  <SortIcon field="name" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('industry')}
                  className="flex items-center gap-2 font-semibold text-gray-900 hover:text-gray-700"
                >
                  {t('templates.list.industry')}
                  <SortIcon field="industry" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('hazards')}
                  className="flex items-center gap-2 font-semibold text-gray-900 hover:text-gray-700"
                >
                  {t('templates.list.hazards')}
                  <SortIcon field="hazards" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('steps')}
                  className="flex items-center gap-2 font-semibold text-gray-900 hover:text-gray-700"
                >
                  {t('templates.list.steps')}
                  <SortIcon field="steps" />
                </button>
              </th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">
                {t('templates.list.vca')}
              </th>
              <th className="px-6 py-3 text-right font-semibold text-gray-900">
                {t('templates.list.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedTemplates.map((template) => (
              <tr key={template.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-600">{template.description}</div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="secondary">{template.industry}</Badge>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {template.hazards.length}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
                    {template.steps.length}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {template.vcaCompliant ? (
                    <Badge variant="success">VCA</Badge>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {onView && (
                      <button
                        onClick={() => onView(template)}
                        className="rounded p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        title={t('templates.list.view')}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(template)}
                        className="rounded p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        title={t('templates.list.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(template)}
                        className="rounded p-2 text-gray-600 hover:bg-red-50 hover:text-red-600"
                        title={t('templates.list.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {t('templates.list.previous')}
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`rounded px-3 py-2 text-sm font-medium ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {t('templates.list.next')}
          </button>
        </div>
      )}
    </div>
  );
}
