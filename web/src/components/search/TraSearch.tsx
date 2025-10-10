"use client";

import React, { useState, useEffect } from "react";
import { useFirebaseSearch, SearchFilters, SearchOptions } from "@/lib/services/search-service";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface SearchResultItem {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  projectName?: string;
  status?: string;
  overallRiskLevel?: string;
  createdAt?: any;
  updatedAt?: any;
  relevanceScore?: number;
  matchedFields?: string[];
}

function SearchResult({ result }: { result: any }) {
  const data = result.data as SearchResultItem;

  return (
    <Card className="p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-lg">{data.title || data.name}</h3>
        <div className="flex gap-2">
          {data.status && (
            <Badge
              variant={
                data.status === "published"
                  ? "success"
                  : data.status === "draft"
                    ? "warning"
                    : "default"
              }
            >
              {data.status}
            </Badge>
          )}
          {data.overallRiskLevel && (
            <Badge
              variant={
                data.overallRiskLevel === "very_high"
                  ? "error"
                  : data.overallRiskLevel === "high"
                    ? "warning"
                    : "info"
              }
            >
              {data.overallRiskLevel}
            </Badge>
          )}
        </div>
      </div>

      {data.projectName && (
        <div className="text-sm text-gray-600 mb-2">Project: {data.projectName}</div>
      )}

      {data.description && <p className="text-sm text-gray-700 mb-2">{data.description}</p>}

      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Relevance: {Math.round(result.relevanceScore || 0)}%</span>
        {result.matchedFields && result.matchedFields.length > 0 && (
          <span>Matched: {result.matchedFields.join(", ")}</span>
        )}
      </div>
    </Card>
  );
}

function SearchFiltersComponent({
  filters,
  onFiltersChange,
  facets,
  isLoading,
}: {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  facets?: Record<string, Record<string, number>>;
  isLoading?: boolean;
}) {
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <h5 className="text-sm font-medium mb-2">Status</h5>
        <div className="space-y-1">
          {["draft", "review", "approved", "published"].map((status) => (
            <label key={status} className="flex items-center">
              <input
                type="checkbox"
                checked={(filters.status as string[])?.includes(status) || false}
                onChange={(e) => {
                  const currentStatus = (filters.status as string[]) || [];
                  if (e.target.checked) {
                    updateFilter("status", [...currentStatus, status]);
                  } else {
                    updateFilter(
                      "status",
                      currentStatus.filter((s) => s !== status)
                    );
                  }
                }}
                className="mr-2"
              />
              {status} {facets?.status?.[status] && `(${facets.status[status]})`}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h5 className="text-sm font-medium mb-2">Risk Level</h5>
        <div className="space-y-1">
          {["trivial", "low", "medium", "high", "very_high"].map((level) => (
            <label key={level} className="flex items-center">
              <input
                type="checkbox"
                checked={(filters.riskLevel as string[])?.includes(level) || false}
                onChange={(e) => {
                  const currentRisk = (filters.riskLevel as string[]) || [];
                  if (e.target.checked) {
                    updateFilter("riskLevel", [...currentRisk, level]);
                  } else {
                    updateFilter(
                      "riskLevel",
                      currentRisk.filter((r) => r !== level)
                    );
                  }
                }}
                className="mr-2"
              />
              {level} {facets?.riskLevel?.[level] && `(${facets.riskLevel[level]})`}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TraSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<
    "relevance" | "createdAt" | "updatedAt" | "name" | "riskScore"
  >("relevance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { search, searchResults, isSearching, error, clearResults } = useFirebaseSearch();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery || Object.keys(filters).length > 0) {
      const searchOptions: SearchOptions = {
        entityType: "tras",
        query: debouncedQuery,
        filters,
        sortBy,
        sortOrder,
        limit: 20,
      };

      search(searchOptions);
    } else {
      clearResults();
    }
  }, [debouncedQuery, filters, sortBy, sortOrder, search, clearResults]);

  const handleSearch = async () => {
    if (query.trim()) {
      const searchOptions: SearchOptions = {
        entityType: "tras",
        query: query.trim(),
        filters,
        sortBy,
        sortOrder,
        limit: 20,
      };

      await search(searchOptions);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">TRA Search</h1>

        {/* Search Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search TRAs by title, description, project..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <LoadingSpinner size="sm" /> : "Search"}
          </Button>
        </div>

        {/* Filters and Sort */}
        <div className="flex gap-4 mb-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded"
          >
            <option value="relevance">Relevance</option>
            <option value="createdAt">Created Date</option>
            <option value="updatedAt">Updated Date</option>
            <option value="name">Name</option>
            <option value="riskScore">Risk Score</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="px-3 py-2 border rounded"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <aside className="col-span-1">
          <Card className="p-4">
            <h4 className="font-semibold mb-4">Filters</h4>
            {isSearching ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <SearchFiltersComponent
                filters={filters}
                onFiltersChange={setFilters}
                facets={searchResults?.facets}
              />
            )}
          </Card>
        </aside>

        {/* Results */}
        <main className="col-span-3">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded mb-4">
              <p className="text-red-800">Error: {error}</p>
            </div>
          )}

          {isSearching && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {searchResults && !isSearching && (
            <>
              <div className="mb-4">
                <p className="text-gray-600">
                  Found {searchResults.totalCount} results
                  {searchResults.hasMore && " (more available)"}
                </p>
              </div>

              <div>
                {searchResults.results.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-gray-500">
                      No results found. Try adjusting your search terms or filters.
                    </p>
                  </Card>
                ) : (
                  searchResults.results.map((result) => (
                    <SearchResult key={result.id} result={result} />
                  ))
                )}
              </div>

              {searchResults.hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // TODO: Implement pagination with cursor
                      console.log("Load more results");
                    }}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}

          {!searchResults && !isSearching && (
            <Card className="p-8 text-center">
              <p className="text-gray-500">
                Enter search terms above to find TRAs, templates, hazards, or projects.
              </p>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
