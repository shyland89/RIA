export const DIMENSION_KEYS = ["segment", "country", "source", "industry", "role"] as const;
export type DimensionKey = (typeof DIMENSION_KEYS)[number];

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  segment: "Segment",
  country: "Country",
  source: "Source",
  industry: "Industry",
  role: "Champion Role",
};

export const UNKNOWN_VALUE = "Unknown";

export type DimensionFilters = Partial<Record<DimensionKey, string[]>>;

export function parseDimensionFiltersFromSearchParams(
  params: URLSearchParams
): DimensionFilters {
  const filters: DimensionFilters = {};
  for (const key of DIMENSION_KEYS) {
    const values = params.getAll(key);
    if (values.length > 0) {
      filters[key] = values;
    }
  }
  return filters;
}

export function parseDimensionFiltersFromBody(
  body: Record<string, any>
): DimensionFilters {
  const filters: DimensionFilters = {};
  for (const key of DIMENSION_KEYS) {
    if (Array.isArray(body[key]) && body[key].length > 0) {
      filters[key] = body[key].map((v: any) => String(v));
    }
  }
  return filters;
}

export function applyDimensionFiltersInMemory<
  T extends Record<string, any>
>(items: T[], filters: DimensionFilters): T[] {
  let filtered = items;
  for (const [key, values] of Object.entries(filters)) {
    if (!values || values.length === 0) continue;
    const hasUnknown = values.includes(UNKNOWN_VALUE);
    const nonUnknownValues = values.filter((v) => v !== UNKNOWN_VALUE);

    filtered = filtered.filter((item) => {
      const val = item[key];
      if (val === null || val === undefined || val === "") {
        return hasUnknown;
      }
      return nonUnknownValues.includes(val);
    });
  }
  return filtered;
}

export function hasActiveDimensionFilters(filters: DimensionFilters): boolean {
  return Object.values(filters).some((v) => v && v.length > 0);
}

export function describeDimensionFilters(filters: DimensionFilters): string {
  const parts: string[] = [];
  for (const key of DIMENSION_KEYS) {
    const values = filters[key];
    if (values && values.length > 0) {
      parts.push(`${DIMENSION_LABELS[key]}: ${values.join(", ")}`);
    }
  }
  return parts.length > 0 ? parts.join(" | ") : "None";
}

export function dimensionFiltersToSearchParams(
  filters: DimensionFilters,
  params: URLSearchParams
): void {
  for (const key of DIMENSION_KEYS) {
    params.delete(key);
    const values = filters[key];
    if (values && values.length > 0) {
      for (const v of values) {
        params.append(key, v);
      }
    }
  }
}
