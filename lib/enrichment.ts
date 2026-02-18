import OpenAI from "openai";

// ─── Industry Cluster Taxonomy (NACE-backed, sales-readable labels) ───────────

export const INDUSTRY_CLUSTERS = [
  "Technology & Software",
  "Financial Services",
  "Professional Services",
  "Healthcare & Life Sciences",
  "Retail & E-commerce",
  "Manufacturing & Industrial",
  "Media & Advertising",
  "Logistics & Transport",
  "Construction & Real Estate",
  "Hospitality & Travel",
  "Public Sector & Education",
  "Telecommunications",
  "Energy & Utilities",
  "Other",
] as const;

export type IndustryCluster = (typeof INDUSTRY_CLUSTERS)[number];

// ─── Source Group Taxonomy ────────────────────────────────────────────────────

export const SOURCE_GROUPS = ["inbound", "outbound", "other"] as const;
export type SourceGroup = (typeof SOURCE_GROUPS)[number];

export const SOURCE_GROUP_LABELS: Record<SourceGroup, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
  other: "Other",
};

// Deterministic fallback rules — used if LLM classification fails
// or as a pre-filter to avoid unnecessary API calls

const INBOUND_KEYWORDS = [
  "website", "web", "organic", "seo", "content", "blog", "social",
  "paid search", "ppc", "adwords", "google ads", "paid", "referral",
  "word of mouth", "wom", "review", "g2", "capterra", "inbound",
  "marketing", "newsletter", "webinar", "conference inbound",
];

const OUTBOUND_KEYWORDS = [
  "outbound", "cold", "sdr", "bdr", "ae", "prospecting", "sequence",
  "cadence", "linkedin", "email outreach", "cold email", "cold call",
  "phone", "direct", "sales rep", "sales development",
];

export function inferSourceGroupDeterministic(rawSource: string): SourceGroup | null {
  const lower = rawSource.toLowerCase().trim();
  if (INBOUND_KEYWORDS.some((k) => lower.includes(k))) return "inbound";
  if (OUTBOUND_KEYWORDS.some((k) => lower.includes(k))) return "outbound";
  return null;
}

// ─── Enrichment Result Types ──────────────────────────────────────────────────

export type IndustryMapping = Record<string, IndustryCluster>; // raw → cluster
export type SourceMapping = Record<string, SourceGroup>;       // raw → group

export type EnrichmentMapping = {
  industry: IndustryMapping;
  source: SourceMapping;
};

// ─── LLM Classification ───────────────────────────────────────────────────────

/**
 * Classify unique raw industry and source values into clusters.
 * Returns deterministic fallback for source values it can resolve without LLM.
 * Runs a single batched LLM call for everything else.
 */
export async function classifyEnrichmentValues(
  uniqueIndustries: string[],
  uniqueSources: string[],
  apiKey: string
): Promise<EnrichmentMapping> {
  // Pre-resolve sources deterministically
  const sourceMapping: SourceMapping = {};
  const sourcesNeedingLLM: string[] = [];

  for (const s of uniqueSources) {
    const det = inferSourceGroupDeterministic(s);
    if (det) {
      sourceMapping[s] = det;
    } else {
      sourcesNeedingLLM.push(s);
    }
  }

  // If nothing needs LLM classification, return early
  if (uniqueIndustries.length === 0 && sourcesNeedingLLM.length === 0) {
    return { industry: {}, source: sourceMapping };
  }

  const openai = new OpenAI({ apiKey });

  const industrySection =
    uniqueIndustries.length > 0
      ? `INDUSTRIES TO CLASSIFY (map each to one of the clusters listed):
${uniqueIndustries.map((i, idx) => `${idx + 1}. "${i}"`).join("\n")}

Available industry clusters:
${INDUSTRY_CLUSTERS.map((c) => `- "${c}"`).join("\n")}`
      : "";

  const sourceSection =
    sourcesNeedingLLM.length > 0
      ? `SOURCES TO CLASSIFY (map each to "inbound", "outbound", or "other"):
${sourcesNeedingLLM.map((s, idx) => `${idx + 1}. "${s}"`).join("\n")}

Rules:
- "inbound": lead came to you (website, paid search, referral, event where prospect approached, partner-sourced)
- "outbound": you went to them (cold outreach, SDR sequences, cold call, LinkedIn prospecting)
- "other": genuinely ambiguous or neither (e.g. "existing customer", "unknown")`
      : "";

  const systemPrompt = `You are a data classification assistant for a B2B sales analytics platform. 
You receive raw values from CRM exports and map them to standardized groups.
Respond ONLY with a valid JSON object — no explanation, no markdown.`;

  const userPrompt = `Classify the following values and return a JSON object with this exact structure:
{
  "industry": { "<raw_value>": "<cluster_label>", ... },
  "source": { "<raw_value>": "<inbound|outbound|other>", ... }
}

${industrySection}

${sourceSection}

Important:
- Every input value must appear as a key in the output
- Use EXACT cluster labels from the list provided — no variations
- If an industry is genuinely ambiguous, use "Other"
- Return empty objects {} for sections with no inputs`;

  try {
    const response = await openai.responses.create({
      model: "gpt-5.2",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      text: {
        format: { type: "json_object" },
      },
    });

    const parsed = JSON.parse(response.output_text);

    const industryMapping: IndustryMapping = {};
    if (parsed.industry && typeof parsed.industry === "object") {
      for (const [raw, cluster] of Object.entries(parsed.industry)) {
        if (INDUSTRY_CLUSTERS.includes(cluster as IndustryCluster)) {
          industryMapping[raw] = cluster as IndustryCluster;
        } else {
          // LLM returned an invalid cluster — fall back to Other
          industryMapping[raw] = "Other";
        }
      }
    }

    // Merge LLM source results with deterministic ones
    if (parsed.source && typeof parsed.source === "object") {
      for (const [raw, group] of Object.entries(parsed.source)) {
        if (SOURCE_GROUPS.includes(group as SourceGroup)) {
          sourceMapping[raw] = group as SourceGroup;
        } else {
          sourceMapping[raw] = "other";
        }
      }
    }

    // Fill in any industries not returned by LLM
    for (const industry of uniqueIndustries) {
      if (!industryMapping[industry]) {
        industryMapping[industry] = "Other";
      }
    }

    return { industry: industryMapping, source: sourceMapping };
  } catch (err) {
    console.error("Enrichment classification failed:", err);

    // Full fallback — return Other for all industries, other for unresolved sources
    const industryFallback: IndustryMapping = {};
    for (const i of uniqueIndustries) industryFallback[i] = "Other";

    for (const s of sourcesNeedingLLM) sourceMapping[s] = "other";

    return { industry: industryFallback, source: sourceMapping };
  }
}

/**
 * Apply enrichment mapping to a row's raw field values.
 * Returns null if the raw value isn't in the mapping (e.g. field was null).
 */
export function applyIndustryCluster(
  rawIndustry: string | null | undefined,
  mapping: IndustryMapping
): string | null {
  if (!rawIndustry) return null;
  return mapping[rawIndustry] ?? null;
}

export function applySourceGroup(
  rawSource: string | null | undefined,
  mapping: SourceMapping
): SourceGroup | null {
  if (!rawSource) return null;
  return mapping[rawSource] ?? null;
}

/**
 * Extract unique non-null values for a given field from parsed CSV records.
 */
export function extractUniqueValues(
  records: Record<string, string>[],
  columnName: string | undefined
): string[] {
  if (!columnName) return [];
  const seen = new Set<string>();
  for (const row of records) {
    const val = row[columnName]?.trim();
    if (val && val !== "" && !["na", "n/a", "null", "none", "-"].includes(val.toLowerCase())) {
      seen.add(val);
    }
  }
  return Array.from(seen);
}