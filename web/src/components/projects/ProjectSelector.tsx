"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FormField } from "../ui/FormField";
import { useTranslations } from "next-intl";

interface Project {
  id: string;
  name: string;
  location?: {
    city?: string;
    address?: string;
    country?: string;
  } | string | null;
  description?: string | null;
  organizationId?: string;
}

// Helper function to format location for display
function formatLocation(location?: { city?: string; address?: string; country?: string } | string | null): string {
  if (!location) return "";
  if (typeof location === "string") return location;
  
  // Format location object as "City, Country" or just "City" or "Country"
  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.country && location.country !== location.city) parts.push(location.country);
  return parts.join(", ");
}

interface ProjectSelectorProps {
  value?: string;
  onChange: (projectId: string) => void;
  organizationId: string;
  error?: string;
  required?: boolean;
}

export function ProjectSelector({
  value,
  onChange,
  organizationId,
  error,
  required,
}: ProjectSelectorProps) {
  const t = useTranslations("safety.tra.wizard.projectSelector");
  const [projects, setProjects] = useState<Project[]>([]);
  const [filtered, setFiltered] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Failed to load projects");
        const body = await res.json();
        const items = Array.isArray(body.projects) ? body.projects : [];
        if (!mounted) return;
        setProjects(items);
        setFiltered(items);
      } catch (e: any) {
        setFetchError(e?.message || "Unknown error");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [organizationId]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setFiltered(projects);
      setHighlight(0);
      return;
    }
    const f = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        formatLocation(p.location).toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
    );
    setFiltered(f);
    setHighlight(0);
  }, [query, projects]);

  const selectedProject = useMemo(() => projects.find((p) => p.id === value), [projects, value]);

  function handleSelect(p: Project) {
    onChange(p.id);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[highlight];
      if (item) handleSelect(item);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <FormField
        label={t("label")}
        htmlFor="project-selector"
        required={required}
      >
        <div>
          <div
            className="flex items-center gap-2 border rounded px-3 py-2 bg-white cursor-text"
            onClick={() => {
              // Always open on click instead of toggling to avoid flicker on first interaction
              setOpen(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
          >
            <div className="flex-1 min-w-0">
              <input
                id="project-selector"
                ref={inputRef}
                value={open ? query : selectedProject ? selectedProject.name : query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={t("placeholder")}
                className="w-full outline-none"
                aria-expanded={open}
                aria-autocomplete="list"
                aria-controls="project-selector-listbox"
              />
            </div>
            <div className="text-slate-400 text-sm">{selectedProject ? formatLocation(selectedProject.location) : ""}</div>
          </div>

          {/* Dropdown */}
          {open && (
            <div
              id="project-selector-listbox"
              role="listbox"
              className="absolute z-50 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto"
            >
              {loading ? (
                <div className="p-3 text-sm text-slate-600">{t("loading")}</div>
              ) : fetchError ? (
                <div className="p-3 text-sm text-red-600">{t("loadError")}</div>
              ) : filtered.length === 0 ? (
                <div className="p-3 text-sm text-slate-600">{t("noResults")}</div>
              ) : (
                filtered.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={value === p.id}
                    onClick={() => handleSelect(p)}
                    onMouseEnter={() => setHighlight(idx)}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between ${
                      idx === highlight ? "bg-slate-100" : ""
                    }`}
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      {formatLocation(p.location) && <div className="text-xs text-slate-500">{formatLocation(p.location)}</div>}
                      {!formatLocation(p.location) && p.description && (
                        <div className="text-xs text-slate-500 line-clamp-1">{p.description}</div>
                      )}
                    </div>
                    {value === p.id && <div className="text-blue-600">✓</div>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            </FormField>
    </div>
  );
}