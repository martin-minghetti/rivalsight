"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface Filter {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FilterBarProps {
  filters: Filter[];
}

export default function FilterBar({ filters }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {filters.map((filter) => (
        <div key={filter.key} className="flex items-center gap-2">
          <label
            htmlFor={`filter-${filter.key}`}
            className="text-xs text-gray-500 font-medium"
          >
            {filter.label}
          </label>
          <select
            id={`filter-${filter.key}`}
            value={searchParams.get(filter.key) ?? ""}
            onChange={(e) => handleChange(filter.key, e.target.value)}
            className="text-sm border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
