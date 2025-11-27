"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { TraTemplate } from "@/types/tra-template";
import { Badge } from "@/components/ui/Badge";
import { Search, AlertCircle, CheckCircle2, Layers, X, Filter, ChevronLeft, ChevronRight } from "lucide-react";

interface TemplateSelectorProps {
  value?: string; // selected templateId
  onChange: (templateId: string | null) => void;
  organizationId: string;
  onTemplateLoad?: (templateData: TraTemplate) => void;
  error?: string;
}


export default function TemplateSelector({
  value,
  onChange,
  organizationId,
  onTemplateLoad,
  error,
}: TemplateSelectorProps) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const CARDS_PER_VIEW = 1; // Show 1 template at a time for full preview

  // Load templates from API, fallback to bundled system templates on error
  const [localTemplates, setLocalTemplates] = useState<TraTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const url = `/api/templates${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load templates");
        const json = await res.json();
        const list = Array.isArray(json?.templates) ? json.templates : [];
        if (!cancelled) {
          setLocalTemplates(list);
          setErrorState(null);
        }
      } catch (e) {
        console.error("[TemplateSelector] fetch failed:", e);
        if (!cancelled) {
          setErrorState((e as any)?.message || String(e));
          // Fallback to bundled templates if available
          try {
            const mod = await import("@/lib/templates/load-templates");
            const loaded = mod.getAllTemplates ? mod.getAllTemplates() : [];
            setLocalTemplates(Array.isArray(loaded) ? loaded : []);
          } catch (inner) {
            console.error("[TemplateSelector] fallback dynamic load failed:", inner);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const categories = useMemo(() => {
    const cats = new Set(localTemplates.map((t) => t.industry));
    return Array.from(cats).sort();
  }, [localTemplates]);

  const filteredTemplates = useMemo(() => {
    return localTemplates.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || template.industry === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [localTemplates, searchQuery, selectedCategory]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setCurrentIndex(0);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(filteredTemplates.length - 1, prev + 1));
  };

  const visibleTemplates = useMemo(() => {
    const start = currentIndex;
    const end = Math.min(start + CARDS_PER_VIEW, filteredTemplates.length);
    return filteredTemplates.slice(start, end);
  }, [filteredTemplates, currentIndex]);

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex + CARDS_PER_VIEW < filteredTemplates.length;

  // Force recompile - NEW CAROUSEL VERSION
  console.log('[TemplateSelector] NEW CAROUSEL VERSION LOADED', { currentIndex, visibleTemplates: visibleTemplates.length });
  
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8 rounded-lg">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            {t("templates.selector.title")}
          </h1>
          <p className="text-base text-gray-600 md:text-lg">{t("templates.selector.subtitle")}</p>
        </div>

        {/* Search Bar - Improved */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t("templates.selector.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-12 text-base shadow-sm transition-all placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Zoekopdracht wissen"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Category Filter - Improved */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" />
            <span>{t("templates.selector.filterByCategory")}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2"
                  : "bg-white text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300"
              }`}
            >
              {t("templates.selector.allCategories")}
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2"
                    : "bg-white text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300"
                }`}
              >
                {t(`templates.industries.${category}`) || category}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count with Navigation */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Layers className="h-4 w-4" />
            <span>
              {filteredTemplates.length} {t("templates.selector.templatesFound")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {(searchQuery || selectedCategory !== "all") && (
              <button
                onClick={handleResetFilters}
                className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
              >
                {t("templates.selector.resetFilters")}
              </button>
            )}
            {filteredTemplates.length > CARDS_PER_VIEW && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={!canGoPrevious}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Vorige sjablonen"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm text-gray-600">
                  {currentIndex + 1} - {Math.min(currentIndex + CARDS_PER_VIEW, filteredTemplates.length)} / {filteredTemplates.length}
                </span>
                <button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Volgende sjablonen"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Templates Carousel */}
        {isLoading ? (
          <div className="p-6 text-center text-sm text-gray-600">{t("templates.loading")}</div>
        ) : filteredTemplates.length > 0 ? (
          <div className="relative">
            {/* Single Template Display - Full Width */}
            <div className="max-w-5xl mx-auto">
              {currentIndex === 0 && !filteredTemplates.length ? (
                <TemplateCardLarge
                  template={{
                    id: "__start_from_scratch__",
                    name: t("templates.startFromScratch"),
                    description: t("templates.startFromScratchDesc"),
                    industry: "",
                    hazards: [],
                    steps: [],
                    vcaCompliant: false,
                  } as any}
                  isSelected={!value}
                  onSelect={() => onChange(null)}
                />
              ) : (
                visibleTemplates.map((template) => (
                  <TemplateCardLarge
                    key={template.id}
                    template={template}
                    isSelected={template.id === value}
                    onSelect={(t) => {
                      onChange?.(t.id);
                      onTemplateLoad?.(t);
                    }}
                  />
                ))
              )}
            </div>
            
            {/* Large Navigation Controls - Below Template */}
            {filteredTemplates.length > 1 && (
              <div className="flex items-center justify-center gap-6 mt-8">
                <button
                  onClick={handlePrevious}
                  disabled={!canGoPrevious}
                  className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg hover:shadow-xl disabled:shadow-none font-medium text-lg"
                >
                  <ChevronLeft className="h-6 w-6" />
                  Vorige
                </button>
                
                <div className="px-8 py-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentIndex + 1}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 mx-3">/</span>
                  <span className="text-xl text-gray-600 dark:text-gray-400">
                    {filteredTemplates.length}
                  </span>
                </div>
                
                <button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg hover:shadow-xl disabled:shadow-none font-medium text-lg"
                >
                  Volgende
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white py-16 px-4">
            <AlertCircle className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {t("templates.selector.noTemplatesFound")}
            </h3>
            <p className="mb-6 text-center text-sm text-gray-600">
              {t("templates.selector.noTemplatesDescription")}
            </p>
            <button
              onClick={handleResetFilters}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {t("templates.selector.resetFilters")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Large Template Card Component for Carousel
interface TemplateCardLargeProps {
  template: TraTemplate;
  isSelected: boolean;
  onSelect: (template: TraTemplate) => void;
}

function TemplateCardLarge({ template, isSelected, onSelect }: TemplateCardLargeProps) {
  const t = useTranslations();

  return (
    <button
      onClick={() => onSelect(template)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white text-left shadow-xl transition-all hover:shadow-2xl min-h-[600px] ${
        isSelected
          ? "border-blue-600 ring-4 ring-blue-600 ring-opacity-30"
          : "border-gray-200 hover:border-blue-300"
      }`}
    >
      {/* Header Section with Gradient Background - FIXED HEIGHT */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-8 h-48">
        <div className="flex items-start justify-between h-full">
          {/* Title and Category - FULL WIDTH */}
          <div className="flex flex-col justify-center flex-1 pr-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors leading-snug">
              {template.name}
            </h3>
            {template.industry && (
              <span className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm w-fit">
                {t(`templates.industries.${template.industry}`) || template.industry}
              </span>
            )}
          </div>

          {/* VCA Badge */}
          <Badge
            variant={template.vcaCompliant ? "success" : "secondary"}
            className="text-base px-4 py-2 shadow-md flex-shrink-0"
          >
            {template.vcaCompliant ? "✓ VCA Compliant" : t("templates.standard")}
          </Badge>
        </div>
      </div>

      {/* Content Section - FIXED HEIGHT */}
      <div className="p-8 space-y-6 h-[452px] flex flex-col">
        {/* Description - FIXED Height Container */}
        <div className="flex-shrink-0">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            Beschrijving
          </h4>
          <div className="h-32 overflow-hidden">
            <p className="text-lg text-gray-700 leading-relaxed line-clamp-4">
              {template.description}
            </p>
          </div>
        </div>

        {/* Stats Grid - FIXED HEIGHT */}
        <div className="grid grid-cols-2 gap-6 flex-shrink-0">
          <div className="flex items-center gap-4 p-5 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500">
              <div className="h-2 w-2 rounded-full bg-white"></div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {template.hazards.length}
              </div>
              <div className="text-sm font-medium text-gray-600">
                Gevaren geïdentificeerd
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-5 bg-green-50 rounded-xl border border-green-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500">
              <div className="h-2 w-2 rounded-full bg-white"></div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {template.steps.length}
              </div>
              <div className="text-sm font-medium text-gray-600">
                Werkstappen
              </div>
            </div>
          </div>
        </div>

        {/* Selection Status - FIXED HEIGHT */}
        <div className="flex-shrink-0 h-20">
          {isSelected ? (
            <div className="flex items-center justify-center gap-3 p-5 bg-blue-50 rounded-xl border-2 border-blue-200 h-full">
              <CheckCircle2 className="h-7 w-7 text-blue-600 flex-shrink-0" />
              <span className="text-lg font-bold text-blue-700">
                Dit sjabloon is geselecteerd
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-200 h-full">
              <span className="text-sm font-medium text-gray-600">
                Klik om dit sjabloon te selecteren
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
