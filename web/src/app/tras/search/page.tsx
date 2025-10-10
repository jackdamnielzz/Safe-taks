"use client";

import React from "react";

/**
 * TRA Search UI (Phase 2 - Algolia POC)
 * - Placeholder page and component scaffold for InstantSearch integration
 * - To be wired to Algolia using react-instantsearch-hooks-web in next steps
 */

export default function TRASearchPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">TRA Search (POC)</h1>
      <div className="bg-white border rounded p-4">
        <input
          aria-label="Search TRAs"
          placeholder="Search TRAs, projects, templates..."
          className="w-full px-3 py-2 border rounded"
        />
        <div className="mt-4 text-sm text-gray-500">
          Algolia integration scaffolded in functions/src/indexers/tras-to-algolia.ts — next: wire
          InstantSearch and add facets, sorting, pagination.
        </div>
      </div>
    </div>
  );
}
