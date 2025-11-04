'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { TraTemplate } from '@/types/tra-template';
import { Badge } from '@/components/ui/Badge';
import { Search, Grid3x3, List } from 'lucide-react';

interface TemplateSelectorProps {
  templates: TraTemplate[];
  onSelect: (template: TraTemplate) => void;
  selectedId?: string;
}

type ViewMode = 'grid' | 'list';

export default function TemplateSelector({
  templates,
  onSelect,
  selectedId,
}: TemplateSelectorProps) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.industry));
    return Array.from(cats).sort();
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || template.industry === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t('templates.selector.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t('templates.selector.subtitle')}
          </p>
        </div>
        <div className="flex gap-2 rounded-lg border border-gray-300 bg-white p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded px-3 py-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Grid view"
          >
            <Grid3x3 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded px-3 py-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="List view"
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={t('templates.selector.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
        >
          {t('templates.selector.allCategories')}
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="text-sm text-gray-600">
        {t('templates.selector.results', { count: filteredTemplates.length })}
      </div>
      {filteredTemplates.length > 0 ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
              : 'space-y-3'
          }
        >
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedId === template.id}
              onSelect={onSelect}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 py-12 text-center">
          <p className="text-gray-600">{t('templates.selector.noResults')}</p>
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: TraTemplate;
  isSelected: boolean;
  onSelect: (template: TraTemplate) => void;
  viewMode: ViewMode;
}

function TemplateCard({ template, isSelected, onSelect, viewMode }: TemplateCardProps) {
  const t = useTranslations();
  const cardContent = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{template.name}</h3>
          <p className="mt-1 text-sm text-gray-600">{template.description}</p>
        </div>
        {template.vcaCompliant && (
          <Badge variant="success" className="ml-2 flex-shrink-0">VCA</Badge>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="secondary">{template.industry}</Badge>
        <Badge variant="secondary">
          {template.hazards.length} {t('templates.selector.hazards')}
        </Badge>
        <Badge variant="secondary">
          {template.steps.length} {t('templates.selector.steps')}
        </Badge>
      </div>
    </>
  );

  return (
    <button
      onClick={() => onSelect(template)}
      className={`${viewMode === 'list' ? 'w-full' : ''} rounded-lg border-2 p-4 text-left transition-all ${
        isSelected
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {cardContent}
    </button>
  );
}
