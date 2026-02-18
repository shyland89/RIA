module.exports = [
"[project]/lib/enrichment.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "INDUSTRY_CLUSTERS",
    ()=>INDUSTRY_CLUSTERS,
    "SOURCE_GROUPS",
    ()=>SOURCE_GROUPS,
    "SOURCE_GROUP_LABELS",
    ()=>SOURCE_GROUP_LABELS,
    "applyIndustryCluster",
    ()=>applyIndustryCluster,
    "applySourceGroup",
    ()=>applySourceGroup,
    "classifyEnrichmentValues",
    ()=>classifyEnrichmentValues,
    "extractUniqueValues",
    ()=>extractUniqueValues,
    "inferSourceGroupDeterministic",
    ()=>inferSourceGroupDeterministic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/openai/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$client$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__OpenAI__as__default$3e$__ = __turbopack_context__.i("[project]/node_modules/openai/client.mjs [app-ssr] (ecmascript) <export OpenAI as default>");
;
const INDUSTRY_CLUSTERS = [
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
    "Other"
];
const SOURCE_GROUPS = [
    "inbound",
    "outbound",
    "other"
];
const SOURCE_GROUP_LABELS = {
    inbound: "Inbound",
    outbound: "Outbound",
    other: "Other"
};
// Deterministic fallback rules — used if LLM classification fails
// or as a pre-filter to avoid unnecessary API calls
const INBOUND_KEYWORDS = [
    "website",
    "web",
    "organic",
    "seo",
    "content",
    "blog",
    "social",
    "paid search",
    "ppc",
    "adwords",
    "google ads",
    "paid",
    "referral",
    "word of mouth",
    "wom",
    "review",
    "g2",
    "capterra",
    "inbound",
    "marketing",
    "newsletter",
    "webinar",
    "conference inbound"
];
const OUTBOUND_KEYWORDS = [
    "outbound",
    "cold",
    "sdr",
    "bdr",
    "ae",
    "prospecting",
    "sequence",
    "cadence",
    "linkedin",
    "email outreach",
    "cold email",
    "cold call",
    "phone",
    "direct",
    "sales rep",
    "sales development"
];
function inferSourceGroupDeterministic(rawSource) {
    const lower = rawSource.toLowerCase().trim();
    if (INBOUND_KEYWORDS.some((k)=>lower.includes(k))) return "inbound";
    if (OUTBOUND_KEYWORDS.some((k)=>lower.includes(k))) return "outbound";
    return null;
}
async function classifyEnrichmentValues(uniqueIndustries, uniqueSources, apiKey) {
    // Pre-resolve sources deterministically
    const sourceMapping = {};
    const sourcesNeedingLLM = [];
    for (const s of uniqueSources){
        const det = inferSourceGroupDeterministic(s);
        if (det) {
            sourceMapping[s] = det;
        } else {
            sourcesNeedingLLM.push(s);
        }
    }
    // If nothing needs LLM classification, return early
    if (uniqueIndustries.length === 0 && sourcesNeedingLLM.length === 0) {
        return {
            industry: {},
            source: sourceMapping
        };
    }
    const openai = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$client$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__OpenAI__as__default$3e$__["default"]({
        apiKey
    });
    const industrySection = uniqueIndustries.length > 0 ? `INDUSTRIES TO CLASSIFY (map each to one of the clusters listed):
${uniqueIndustries.map((i, idx)=>`${idx + 1}. "${i}"`).join("\n")}

Available industry clusters:
${INDUSTRY_CLUSTERS.map((c)=>`- "${c}"`).join("\n")}` : "";
    const sourceSection = sourcesNeedingLLM.length > 0 ? `SOURCES TO CLASSIFY (map each to "inbound", "outbound", or "other"):
${sourcesNeedingLLM.map((s, idx)=>`${idx + 1}. "${s}"`).join("\n")}

Rules:
- "inbound": lead came to you (website, paid search, referral, event where prospect approached, partner-sourced)
- "outbound": you went to them (cold outreach, SDR sequences, cold call, LinkedIn prospecting)
- "other": genuinely ambiguous or neither (e.g. "existing customer", "unknown")` : "";
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
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ],
            text: {
                format: {
                    type: "json_object"
                }
            }
        });
        const parsed = JSON.parse(response.output_text);
        const industryMapping = {};
        if (parsed.industry && typeof parsed.industry === "object") {
            for (const [raw, cluster] of Object.entries(parsed.industry)){
                if (INDUSTRY_CLUSTERS.includes(cluster)) {
                    industryMapping[raw] = cluster;
                } else {
                    // LLM returned an invalid cluster — fall back to Other
                    industryMapping[raw] = "Other";
                }
            }
        }
        // Merge LLM source results with deterministic ones
        if (parsed.source && typeof parsed.source === "object") {
            for (const [raw, group] of Object.entries(parsed.source)){
                if (SOURCE_GROUPS.includes(group)) {
                    sourceMapping[raw] = group;
                } else {
                    sourceMapping[raw] = "other";
                }
            }
        }
        // Fill in any industries not returned by LLM
        for (const industry of uniqueIndustries){
            if (!industryMapping[industry]) {
                industryMapping[industry] = "Other";
            }
        }
        return {
            industry: industryMapping,
            source: sourceMapping
        };
    } catch (err) {
        console.error("Enrichment classification failed:", err);
        // Full fallback — return Other for all industries, other for unresolved sources
        const industryFallback = {};
        for (const i of uniqueIndustries)industryFallback[i] = "Other";
        for (const s of sourcesNeedingLLM)sourceMapping[s] = "other";
        return {
            industry: industryFallback,
            source: sourceMapping
        };
    }
}
function applyIndustryCluster(rawIndustry, mapping) {
    if (!rawIndustry) return null;
    return mapping[rawIndustry] ?? null;
}
function applySourceGroup(rawSource, mapping) {
    if (!rawSource) return null;
    return mapping[rawSource] ?? null;
}
function extractUniqueValues(records, columnName) {
    if (!columnName) return [];
    const seen = new Set();
    for (const row of records){
        const val = row[columnName]?.trim();
        if (val && val !== "" && ![
            "na",
            "n/a",
            "null",
            "none",
            "-"
        ].includes(val.toLowerCase())) {
            seen.add(val);
        }
    }
    return Array.from(seen);
}
}),
"[project]/app/app/import/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ImportPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$enrichment$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/enrichment.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const NOT_PROVIDED = "__not_provided__";
const TARGET_FIELDS = [
    {
        key: "name",
        label: "Name",
        required: true
    },
    {
        key: "amount",
        label: "Amount",
        required: true
    },
    {
        key: "outcome",
        label: "Outcome",
        required: true
    },
    {
        key: "role",
        label: "Champion Role",
        required: false
    },
    {
        key: "industry",
        label: "Industry",
        required: false
    },
    {
        key: "source",
        label: "Source",
        required: false
    },
    {
        key: "created_at",
        label: "Created At",
        required: false,
        isDate: true
    },
    {
        key: "closed_date",
        label: "Closed Date",
        required: false,
        isDate: true
    },
    {
        key: "pipeline_accepted_date",
        label: "Pipeline Accepted Date",
        required: false,
        isDate: true
    },
    {
        key: "segment",
        label: "Segment",
        required: false
    },
    {
        key: "country",
        label: "Country",
        required: false
    }
];
function ImportPage() {
    const [step, setStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("upload");
    const [file, setFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [uploadResult, setUploadResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [mapping, setMapping] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [importResult, setImportResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [uploading, setUploading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [importing, setImporting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [importMode, setImportMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("append");
    const [showReplaceConfirm, setShowReplaceConfirm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [importHistory, setImportHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [historyLoading, setHistoryLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    // Enrichment state
    const [enrichmentMapping, setEnrichmentMapping] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        industry: {},
        source: {}
    });
    const [enrichmentLoading, setEnrichmentLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [enrichmentError, setEnrichmentError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        fetchHistory();
    }, []);
    async function fetchHistory() {
        setHistoryLoading(true);
        try {
            const res = await fetch("/api/import/jobs");
            if (res.ok) {
                const data = await res.json();
                setImportHistory(data.jobs || []);
            }
        } catch  {}
        setHistoryLoading(false);
    }
    async function handleUpload() {
        if (!file) return;
        setError("");
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/import/upload", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Upload failed");
                setUploading(false);
                return;
            }
            setUploadResult(data);
            const autoMapping = {};
            for (const field of TARGET_FIELDS){
                const match = data.headers.find((h)=>h.toLowerCase().replace(/[_\s-]/g, "") === field.key.replace(/_/g, ""));
                if (match) autoMapping[field.key] = match;
            }
            setMapping(autoMapping);
            setStep("mapping");
        } catch  {
            setError("Failed to upload file. Please try again.");
        } finally{
            setUploading(false);
        }
    }
    function handleMappingChange(targetField, csvHeader) {
        setMapping((prev)=>({
                ...prev,
                [targetField]: csvHeader
            }));
    }
    function isMappingValid() {
        const requiredOk = TARGET_FIELDS.filter((f)=>f.required).every((f)=>mapping[f.key] && mapping[f.key] !== "" && mapping[f.key] !== NOT_PROVIDED);
        const dateFields = TARGET_FIELDS.filter((f)=>f.isDate);
        const hasAtLeastOneDate = dateFields.some((f)=>mapping[f.key] && mapping[f.key] !== "" && mapping[f.key] !== NOT_PROVIDED);
        return requiredOk && hasAtLeastOneDate;
    }
    function getMappingWarnings() {
        const warnings = [];
        const dateFields = TARGET_FIELDS.filter((f)=>f.isDate);
        const hasDate = dateFields.some((f)=>mapping[f.key] && mapping[f.key] !== "" && mapping[f.key] !== NOT_PROVIDED);
        if (!hasDate) warnings.push("At least one date field (Created At, Closed Date, or Pipeline Accepted Date) is required.");
        return warnings;
    }
    // ─── Enrichment Preview ────────────────────────────────────────────────────
    async function handleProceedToEnrichment() {
        if (!uploadResult) return;
        const hasIndustry = mapping.industry && mapping.industry !== "" && mapping.industry !== NOT_PROVIDED;
        const hasSource = mapping.source && mapping.source !== "" && mapping.source !== NOT_PROVIDED;
        // If neither field is mapped, skip enrichment step
        if (!hasIndustry && !hasSource) {
            handleImportClick();
            return;
        }
        setEnrichmentLoading(true);
        setEnrichmentError("");
        setStep("enrichment");
        try {
            // Collect unique values from preview (full classification happens at import,
            // but preview gives us enough to show the user a representative sample)
            const industries = hasIndustry ? [
                ...new Set(uploadResult.preview.map((r)=>r[mapping.industry]?.trim()).filter((v)=>!!v && v !== ""))
            ] : [];
            const sources = hasSource ? [
                ...new Set(uploadResult.preview.map((r)=>r[mapping.source]?.trim()).filter((v)=>!!v && v !== ""))
            ] : [];
            const res = await fetch("/api/import/classify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    industries,
                    sources
                })
            });
            const data = await res.json();
            if (!res.ok) {
                setEnrichmentError(data.error || "Classification failed");
                return;
            }
            setEnrichmentMapping(data.enrichmentMapping);
        } catch  {
            setEnrichmentError("Classification failed. You can adjust manually or skip.");
        } finally{
            setEnrichmentLoading(false);
        }
    }
    function updateIndustryCluster(rawValue, newCluster) {
        setEnrichmentMapping((prev)=>({
                ...prev,
                industry: {
                    ...prev.industry,
                    [rawValue]: newCluster
                }
            }));
    }
    function updateSourceGroup(rawValue, newGroup) {
        setEnrichmentMapping((prev)=>({
                ...prev,
                source: {
                    ...prev.source,
                    [rawValue]: newGroup
                }
            }));
    }
    // ──────────────────────────────────────────────────────────────────────────
    function handleImportClick() {
        if (importMode === "replace") setShowReplaceConfirm(true);
        else doImport();
    }
    async function doImport() {
        if (!file || !uploadResult) return;
        setError("");
        setImporting(true);
        setStep("importing");
        setShowReplaceConfirm(false);
        try {
            const cleanMapping = {};
            for (const [key, val] of Object.entries(mapping)){
                if (val && val !== "" && val !== NOT_PROVIDED) cleanMapping[key] = val;
            }
            const formData = new FormData();
            formData.append("file", file);
            formData.append("mapping", JSON.stringify(cleanMapping));
            formData.append("enrichment_mapping", JSON.stringify(enrichmentMapping));
            formData.append("mode", importMode);
            const res = await fetch("/api/import/execute", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Import failed");
                setStep("mapping");
                setImporting(false);
                return;
            }
            setImportResult(data);
            setStep("results");
            fetchHistory();
        } catch  {
            setError("Import failed. Please try again.");
            setStep("mapping");
        } finally{
            setImporting(false);
        }
    }
    function handleReset() {
        setStep("upload");
        setFile(null);
        setUploadResult(null);
        setMapping({});
        setImportResult(null);
        setError("");
        setImportMode("append");
        setEnrichmentMapping({
            industry: {},
            source: {}
        });
        setEnrichmentError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
    const selectStyle = {
        border: "1px solid var(--stone-200)",
        borderRadius: "var(--radius-sm, 6px)",
        color: "var(--stone-700)",
        background: "var(--stone-50)"
    };
    const isEnrichmentStep = step === "enrichment";
    const isDoneStep = step === "importing" || step === "results";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen",
        style: {
            background: "var(--stone-50)"
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
            style: {
                padding: "28px 40px 60px"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-[22px] font-bold tracking-tight",
                            style: {
                                color: "var(--stone-900)",
                                letterSpacing: "-0.3px"
                            },
                            children: "Import Opportunities"
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 314,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm mt-1",
                            style: {
                                color: "var(--stone-500)"
                            },
                            children: "Upload a CSV file to import opportunities into your organization."
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 320,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/app/import/page.tsx",
                    lineNumber: 313,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-0 mb-8 pt-2",
                    "data-testid": "progress-steps",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StepIndicator, {
                            label: "Upload",
                            active: step === "upload",
                            done: step !== "upload",
                            num: 1
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 327,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StepDivider, {
                            done: step !== "upload"
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 328,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StepIndicator, {
                            label: "Map Columns",
                            active: step === "mapping",
                            done: isEnrichmentStep || isDoneStep,
                            num: 2
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 329,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StepDivider, {
                            done: isEnrichmentStep || isDoneStep
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 335,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StepIndicator, {
                            label: "Review Groups",
                            active: step === "enrichment",
                            done: isDoneStep,
                            num: 3
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 336,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StepDivider, {
                            done: isDoneStep
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 342,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StepIndicator, {
                            label: "Import",
                            active: step === "importing" || step === "results",
                            done: step === "results",
                            num: 4
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 343,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/app/import/page.tsx",
                    lineNumber: 326,
                    columnNumber: 9
                }, this),
                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-6 px-4 py-3 text-sm",
                    style: {
                        border: "1px solid #fca5a5",
                        background: "var(--error-bg)",
                        color: "var(--error)",
                        borderRadius: "var(--radius-md, 10px)"
                    },
                    "data-testid": "text-error",
                    children: error
                }, void 0, false, {
                    fileName: "[project]/app/app/import/page.tsx",
                    lineNumber: 352,
                    columnNumber: 11
                }, this),
                step === "upload" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white",
                    style: {
                        border: "1px solid var(--stone-200)",
                        borderRadius: "var(--radius-lg, 14px)",
                        overflow: "hidden"
                    },
                    "data-testid": "section-upload",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-sm font-semibold mb-4",
                                style: {
                                    color: "var(--stone-900)"
                                },
                                children: "Select CSV file"
                            }, void 0, false, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 378,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm mb-4",
                                style: {
                                    color: "var(--stone-500)"
                                },
                                children: "Your CSV must include columns for: name, amount, outcome, and at least one date (created_at, closed_date, or pipeline_accepted_date). Other columns are optional."
                            }, void 0, false, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 381,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs mb-4",
                                style: {
                                    color: "var(--stone-400)"
                                },
                                children: 'Values like "NA", "N/A", "null", "none", or empty cells are treated as missing data.'
                            }, void 0, false, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 385,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block cursor-pointer transition-colors mb-4",
                                style: {
                                    border: "2px dashed var(--stone-300)",
                                    borderRadius: "var(--radius-lg, 14px)",
                                    padding: "56px 40px",
                                    textAlign: "center",
                                    background: file ? "var(--teal-50)" : "var(--stone-50)",
                                    borderColor: file ? "var(--teal-400)" : "var(--stone-300)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        ref: fileInputRef,
                                        type: "file",
                                        accept: ".csv",
                                        onChange: (e)=>setFile(e.target.files?.[0] || null),
                                        className: "hidden",
                                        "data-testid": "input-file"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 400,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center",
                                        style: {
                                            background: "var(--teal-100)"
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            className: "w-5 h-5",
                                            style: {
                                                color: "var(--teal-600)"
                                            },
                                            fill: "none",
                                            stroke: "currentColor",
                                            viewBox: "0 0 24 24",
                                            strokeWidth: 2,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 420,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                    points: "17 8 12 3 7 8"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 421,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                    x1: "12",
                                                    y1: "3",
                                                    x2: "12",
                                                    y2: "15"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 422,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/app/import/page.tsx",
                                            lineNumber: 412,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 408,
                                        columnNumber: 17
                                    }, this),
                                    file ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[15px] font-semibold",
                                        style: {
                                            color: "var(--stone-900)"
                                        },
                                        children: file.name
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 426,
                                        columnNumber: 19
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[15px] font-semibold mb-1",
                                                style: {
                                                    color: "var(--stone-900)"
                                                },
                                                children: [
                                                    "Drop your CSV here or",
                                                    " ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            color: "var(--teal-600)"
                                                        },
                                                        children: "browse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 433,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 431,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[13px]",
                                                style: {
                                                    color: "var(--stone-500)"
                                                },
                                                children: "CSV files up to 10 MB"
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 435,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 389,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleUpload,
                                disabled: !file || uploading,
                                className: "inline-flex items-center px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                                style: {
                                    background: "var(--teal-600)",
                                    borderRadius: "var(--radius-sm, 6px)"
                                },
                                "data-testid": "button-upload",
                                children: uploading ? "Parsing..." : "Upload & Preview"
                            }, void 0, false, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 441,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/app/import/page.tsx",
                        lineNumber: 377,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/app/import/page.tsx",
                    lineNumber: 368,
                    columnNumber: 11
                }, this),
                step === "mapping" && uploadResult && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white",
                            style: {
                                border: "1px solid var(--stone-200)",
                                borderRadius: "var(--radius-lg, 14px)",
                                overflow: "hidden"
                            },
                            "data-testid": "section-mapping",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between gap-4 flex-wrap mb-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                className: "text-sm font-semibold",
                                                style: {
                                                    color: "var(--stone-900)"
                                                },
                                                children: "Column Mapping"
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 468,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs",
                                                style: {
                                                    color: "var(--stone-500)"
                                                },
                                                "data-testid": "text-file-info",
                                                children: [
                                                    uploadResult.filename,
                                                    " — ",
                                                    uploadResult.totalRows,
                                                    " rows"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 471,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 467,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm mb-2",
                                        style: {
                                            color: "var(--stone-500)"
                                        },
                                        children: "Map each CSV column to the corresponding opportunity field. Only Name, Amount, and Outcome are required. At least one date field must also be mapped."
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 479,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs mb-4",
                                        style: {
                                            color: "var(--stone-400)"
                                        },
                                        children: 'Optional fields can be set to "Not provided" if your CSV doesn\'t include them.'
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 483,
                                        columnNumber: 17
                                    }, this),
                                    getMappingWarnings().map((w, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mb-3 px-3 py-2 text-xs",
                                            style: {
                                                border: "1px solid #fcd34d",
                                                background: "var(--warning-bg)",
                                                color: "var(--warning)",
                                                borderRadius: "var(--radius-sm, 6px)"
                                            },
                                            "data-testid": `mapping-warning-${i}`,
                                            children: w
                                        }, i, false, {
                                            fileName: "[project]/app/app/import/page.tsx",
                                            lineNumber: 488,
                                            columnNumber: 19
                                        }, this)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid gap-3 sm:grid-cols-2",
                                        children: TARGET_FIELDS.map((field)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-col gap-1",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "text-xs font-semibold",
                                                        style: {
                                                            color: "var(--stone-700)"
                                                        },
                                                        children: [
                                                            field.label,
                                                            field.required && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    color: "var(--error)"
                                                                },
                                                                className: "ml-0.5",
                                                                children: "*"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 508,
                                                                columnNumber: 27
                                                            }, this),
                                                            !field.required && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "font-normal ml-1",
                                                                style: {
                                                                    color: "var(--stone-400)"
                                                                },
                                                                children: "(optional)"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 513,
                                                                columnNumber: 27
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 505,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                        value: mapping[field.key] || "",
                                                        onChange: (e)=>handleMappingChange(field.key, e.target.value),
                                                        className: "px-3 py-2 text-sm font-medium",
                                                        style: selectStyle,
                                                        "data-testid": `select-mapping-${field.key}`,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                value: "",
                                                                children: "— Select column —"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 525,
                                                                columnNumber: 25
                                                            }, this),
                                                            !field.required && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                value: NOT_PROVIDED,
                                                                children: "Not provided"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 526,
                                                                columnNumber: 45
                                                            }, this),
                                                            uploadResult.headers.map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                    value: h,
                                                                    children: h
                                                                }, h, false, {
                                                                    fileName: "[project]/app/app/import/page.tsx",
                                                                    lineNumber: 528,
                                                                    columnNumber: 27
                                                                }, this))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 518,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, field.key, true, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 504,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 502,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 466,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 457,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white",
                            style: {
                                border: "1px solid var(--stone-200)",
                                borderRadius: "var(--radius-lg, 14px)",
                                overflow: "hidden"
                            },
                            "data-testid": "section-import-mode",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-sm font-semibold mb-3",
                                        style: {
                                            color: "var(--stone-900)"
                                        },
                                        children: "Import Mode"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 550,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "flex items-start gap-3 cursor-pointer",
                                                "data-testid": "radio-mode-append",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "radio",
                                                        name: "importMode",
                                                        value: "append",
                                                        checked: importMode === "append",
                                                        onChange: ()=>setImportMode("append"),
                                                        className: "mt-0.5",
                                                        style: {
                                                            accentColor: "var(--teal-600)"
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 558,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-sm font-semibold",
                                                                style: {
                                                                    color: "var(--stone-900)"
                                                                },
                                                                children: "Append"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 568,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-xs",
                                                                style: {
                                                                    color: "var(--stone-500)"
                                                                },
                                                                children: "Add this data alongside your existing opportunities. Previous imports are preserved."
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 571,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 567,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 554,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "flex items-start gap-3 cursor-pointer",
                                                "data-testid": "radio-mode-replace",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "radio",
                                                        name: "importMode",
                                                        value: "replace",
                                                        checked: importMode === "replace",
                                                        onChange: ()=>setImportMode("replace"),
                                                        className: "mt-0.5",
                                                        style: {
                                                            accentColor: "var(--teal-600)"
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 581,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-sm font-semibold",
                                                                style: {
                                                                    color: "var(--stone-900)"
                                                                },
                                                                children: "Replace"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 591,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-xs",
                                                                style: {
                                                                    color: "var(--stone-500)"
                                                                },
                                                                children: "Remove all existing opportunities and replace with this file."
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 594,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 590,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 577,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 553,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 549,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 540,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white",
                            style: {
                                border: "1px solid var(--stone-200)",
                                borderRadius: "var(--radius-lg, 14px)",
                                overflow: "hidden"
                            },
                            "data-testid": "section-preview",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-sm font-semibold mb-4",
                                        style: {
                                            color: "var(--stone-900)"
                                        },
                                        children: [
                                            "Preview (first ",
                                            Math.min(20, uploadResult.preview.length),
                                            " rows)"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 614,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "overflow-x-auto",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                            className: "min-w-full text-[13px]",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        style: {
                                                            borderBottom: "1px solid var(--stone-200)"
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-3 py-2.5 text-left text-[11px] font-semibold uppercase",
                                                                style: {
                                                                    color: "var(--stone-500)",
                                                                    letterSpacing: "0.5px",
                                                                    background: "var(--stone-50)"
                                                                },
                                                                children: "#"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 621,
                                                                columnNumber: 25
                                                            }, this),
                                                            uploadResult.headers.map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-3 py-2.5 text-left text-[11px] font-semibold uppercase whitespace-nowrap",
                                                                    style: {
                                                                        color: "var(--stone-500)",
                                                                        letterSpacing: "0.5px",
                                                                        background: "var(--stone-50)"
                                                                    },
                                                                    children: h
                                                                }, h, false, {
                                                                    fileName: "[project]/app/app/import/page.tsx",
                                                                    lineNumber: 632,
                                                                    columnNumber: 27
                                                                }, this))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 620,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 619,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                    children: uploadResult.preview.map((row, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                            style: {
                                                                borderBottom: "1px solid var(--stone-100)"
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-3 py-2.5 text-xs",
                                                                    style: {
                                                                        color: "var(--stone-400)"
                                                                    },
                                                                    children: i + 1
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/app/import/page.tsx",
                                                                    lineNumber: 649,
                                                                    columnNumber: 27
                                                                }, this),
                                                                uploadResult.headers.map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-3 py-2.5 text-xs whitespace-nowrap max-w-[200px] truncate",
                                                                        style: {
                                                                            color: "var(--stone-700)"
                                                                        },
                                                                        children: row[h] || ""
                                                                    }, h, false, {
                                                                        fileName: "[project]/app/app/import/page.tsx",
                                                                        lineNumber: 653,
                                                                        columnNumber: 29
                                                                    }, this))
                                                            ]
                                                        }, i, true, {
                                                            fileName: "[project]/app/app/import/page.tsx",
                                                            lineNumber: 648,
                                                            columnNumber: 25
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 646,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/app/import/page.tsx",
                                            lineNumber: 618,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 617,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 613,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 604,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3 flex-wrap",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: handleReset,
                                    className: "inline-flex items-center px-5 py-2.5 text-[13px] font-semibold transition-colors",
                                    style: {
                                        background: "#fff",
                                        color: "var(--stone-700)",
                                        border: "1px solid var(--stone-200)",
                                        borderRadius: "var(--radius-sm, 6px)"
                                    },
                                    "data-testid": "button-back-upload",
                                    children: "Back"
                                }, void 0, false, {
                                    fileName: "[project]/app/app/import/page.tsx",
                                    lineNumber: 670,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: handleProceedToEnrichment,
                                    disabled: !isMappingValid(),
                                    className: "inline-flex items-center px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                                    style: {
                                        background: "var(--teal-600)",
                                        borderRadius: "var(--radius-sm, 6px)"
                                    },
                                    "data-testid": "button-proceed-enrichment",
                                    children: "Continue →"
                                }, void 0, false, {
                                    fileName: "[project]/app/app/import/page.tsx",
                                    lineNumber: 683,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 669,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/app/import/page.tsx",
                    lineNumber: 456,
                    columnNumber: 11
                }, this),
                step === "enrichment" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-6",
                    "data-testid": "section-enrichment",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white",
                            style: {
                                border: "1px solid var(--stone-200)",
                                borderRadius: "var(--radius-lg, 14px)",
                                overflow: "hidden"
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-6",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start gap-3 mb-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "inline-flex items-center justify-center w-8 h-8 rounded-md shrink-0",
                                            style: {
                                                background: "var(--teal-50)"
                                            },
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: "w-4 h-4",
                                                style: {
                                                    color: "var(--teal-600)"
                                                },
                                                fill: "none",
                                                stroke: "currentColor",
                                                viewBox: "0 0 24 24",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: 2,
                                                    d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 720,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 713,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/app/import/page.tsx",
                                            lineNumber: 709,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                    className: "text-sm font-semibold",
                                                    style: {
                                                        color: "var(--stone-900)"
                                                    },
                                                    children: "Review AI-Inferred Groups"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 729,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs mt-0.5",
                                                    style: {
                                                        color: "var(--stone-500)"
                                                    },
                                                    children: "We've classified your industry and source values into standard groups. Review and adjust before importing — these groupings will appear as additional dimensions in your analytics."
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 732,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/app/import/page.tsx",
                                            lineNumber: 728,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/app/import/page.tsx",
                                    lineNumber: 708,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 707,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 699,
                            columnNumber: 13
                        }, this),
                        enrichmentLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white p-8 text-center",
                            style: {
                                border: "1px solid var(--stone-200)",
                                borderRadius: "var(--radius-lg, 14px)"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "inline-flex items-center justify-center w-10 h-10 rounded-full mb-3",
                                    style: {
                                        background: "var(--teal-50)"
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-5 h-5 animate-spin",
                                        style: {
                                            color: "var(--teal-600)"
                                        },
                                        fill: "none",
                                        viewBox: "0 0 24 24",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                className: "opacity-25",
                                                cx: "12",
                                                cy: "12",
                                                r: "10",
                                                stroke: "currentColor",
                                                strokeWidth: "4"
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 760,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                className: "opacity-75",
                                                fill: "currentColor",
                                                d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 768,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 754,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/app/import/page.tsx",
                                    lineNumber: 750,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm font-semibold",
                                    style: {
                                        color: "var(--stone-900)"
                                    },
                                    children: "Classifying your data..."
                                }, void 0, false, {
                                    fileName: "[project]/app/app/import/page.tsx",
                                    lineNumber: 775,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs mt-1",
                                    style: {
                                        color: "var(--stone-500)"
                                    },
                                    children: "This takes a few seconds."
                                }, void 0, false, {
                                    fileName: "[project]/app/app/import/page.tsx",
                                    lineNumber: 778,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 743,
                            columnNumber: 15
                        }, this),
                        enrichmentError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "px-4 py-3 text-sm",
                            style: {
                                border: "1px solid #fca5a5",
                                background: "var(--error-bg)",
                                color: "var(--error)",
                                borderRadius: "var(--radius-md, 10px)"
                            },
                            children: enrichmentError
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 785,
                            columnNumber: 15
                        }, this),
                        !enrichmentLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                Object.keys(enrichmentMapping.industry).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-white",
                                    style: {
                                        border: "1px solid var(--stone-200)",
                                        borderRadius: "var(--radius-lg, 14px)",
                                        overflow: "hidden"
                                    },
                                    "data-testid": "section-industry-enrichment",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "px-6 py-4",
                                            style: {
                                                borderBottom: "1px solid var(--stone-100)"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "text-sm font-semibold",
                                                    style: {
                                                        color: "var(--stone-900)"
                                                    },
                                                    children: "Industry → Cluster"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 815,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs mt-0.5",
                                                    style: {
                                                        color: "var(--stone-500)"
                                                    },
                                                    children: "NACE-based groupings. Used for cross-segment analysis."
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 818,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/app/import/page.tsx",
                                            lineNumber: 811,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "divide-y",
                                            style: {
                                                borderColor: "var(--stone-100)"
                                            },
                                            children: Object.entries(enrichmentMapping.industry).map(([raw, cluster])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-4 px-6 py-3",
                                                    "data-testid": `industry-row-${raw}`,
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm font-medium w-48 shrink-0 truncate",
                                                            style: {
                                                                color: "var(--stone-900)"
                                                            },
                                                            title: raw,
                                                            children: raw
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/import/page.tsx",
                                                            lineNumber: 829,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            className: "w-4 h-4 shrink-0",
                                                            style: {
                                                                color: "var(--stone-400)"
                                                            },
                                                            fill: "none",
                                                            stroke: "currentColor",
                                                            viewBox: "0 0 24 24",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                strokeWidth: 2,
                                                                d: "M9 5l7 7-7 7"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 843,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/import/page.tsx",
                                                            lineNumber: 836,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                            value: cluster,
                                                            onChange: (e)=>updateIndustryCluster(raw, e.target.value),
                                                            className: "flex-1 px-3 py-1.5 text-sm",
                                                            style: selectStyle,
                                                            "data-testid": `select-industry-cluster-${raw}`,
                                                            children: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$enrichment$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["INDUSTRY_CLUSTERS"].map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                    value: c,
                                                                    children: c
                                                                }, c, false, {
                                                                    fileName: "[project]/app/app/import/page.tsx",
                                                                    lineNumber: 858,
                                                                    columnNumber: 31
                                                                }, this))
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/import/page.tsx",
                                                            lineNumber: 850,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, raw, true, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 824,
                                                    columnNumber: 25
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/app/app/import/page.tsx",
                                            lineNumber: 822,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/app/import/page.tsx",
                                    lineNumber: 802,
                                    columnNumber: 19
                                }, this),
                                Object.keys(enrichmentMapping.source).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-white",
                                    style: {
                                        border: "1px solid var(--stone-200)",
                                        borderRadius: "var(--radius-lg, 14px)",
                                        overflow: "hidden"
                                    },
                                    "data-testid": "section-source-enrichment",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "px-6 py-4",
                                            style: {
                                                borderBottom: "1px solid var(--stone-100)"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "text-sm font-semibold",
                                                    style: {
                                                        color: "var(--stone-900)"
                                                    },
                                                    children: "Source → Group"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 884,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs mt-0.5",
                                                    style: {
                                                        color: "var(--stone-500)"
                                                    },
                                                    children: "Inbound vs outbound classification for motion analysis."
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 887,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/app/import/page.tsx",
                                            lineNumber: 880,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "divide-y",
                                            style: {
                                                borderColor: "var(--stone-100)"
                                            },
                                            children: Object.entries(enrichmentMapping.source).map(([raw, group])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-4 px-6 py-3",
                                                    "data-testid": `source-row-${raw}`,
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm font-medium w-48 shrink-0 truncate",
                                                            style: {
                                                                color: "var(--stone-900)"
                                                            },
                                                            title: raw,
                                                            children: raw
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/import/page.tsx",
                                                            lineNumber: 898,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            className: "w-4 h-4 shrink-0",
                                                            style: {
                                                                color: "var(--stone-400)"
                                                            },
                                                            fill: "none",
                                                            stroke: "currentColor",
                                                            viewBox: "0 0 24 24",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                strokeWidth: 2,
                                                                d: "M9 5l7 7-7 7"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 912,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/import/page.tsx",
                                                            lineNumber: 905,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                            value: group,
                                                            onChange: (e)=>updateSourceGroup(raw, e.target.value),
                                                            className: "flex-1 px-3 py-1.5 text-sm",
                                                            style: selectStyle,
                                                            "data-testid": `select-source-group-${raw}`,
                                                            children: Object.entries(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$enrichment$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SOURCE_GROUP_LABELS"]).map(([val, label])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                    value: val,
                                                                    children: label
                                                                }, val, false, {
                                                                    fileName: "[project]/app/app/import/page.tsx",
                                                                    lineNumber: 927,
                                                                    columnNumber: 31
                                                                }, this))
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/import/page.tsx",
                                                            lineNumber: 919,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, raw, true, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 893,
                                                    columnNumber: 25
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/app/app/import/page.tsx",
                                            lineNumber: 891,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/app/import/page.tsx",
                                    lineNumber: 871,
                                    columnNumber: 19
                                }, this),
                                Object.keys(enrichmentMapping.industry).length === 0 && Object.keys(enrichmentMapping.source).length === 0 && !enrichmentError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-white p-6 text-center",
                                    style: {
                                        border: "1px solid var(--stone-200)",
                                        borderRadius: "var(--radius-lg, 14px)"
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm",
                                        style: {
                                            color: "var(--stone-500)"
                                        },
                                        children: "No industry or source data found in the preview rows. Groups will be inferred from the full dataset during import."
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 948,
                                        columnNumber: 23
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/app/import/page.tsx",
                                    lineNumber: 941,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3 flex-wrap",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setStep("mapping"),
                                    className: "inline-flex items-center px-5 py-2.5 text-[13px] font-semibold transition-colors",
                                    style: {
                                        background: "#fff",
                                        color: "var(--stone-700)",
                                        border: "1px solid var(--stone-200)",
                                        borderRadius: "var(--radius-sm, 6px)"
                                    },
                                    "data-testid": "button-back-mapping",
                                    children: "Back"
                                }, void 0, false, {
                                    fileName: "[project]/app/app/import/page.tsx",
                                    lineNumber: 958,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: handleImportClick,
                                    disabled: enrichmentLoading,
                                    className: "inline-flex items-center px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                                    style: {
                                        background: importMode === "replace" ? "var(--error)" : "var(--teal-600)",
                                        borderRadius: "var(--radius-sm, 6px)"
                                    },
                                    "data-testid": "button-import",
                                    children: [
                                        importMode === "replace" ? "Replace & Import" : "Import",
                                        " ",
                                        uploadResult?.totalRows,
                                        " ",
                                        "Rows"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/app/import/page.tsx",
                                    lineNumber: 971,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 957,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/app/import/page.tsx",
                    lineNumber: 698,
                    columnNumber: 11
                }, this),
                showReplaceConfirm && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50",
                    "data-testid": "modal-replace-confirm",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white p-6 shadow-xl max-w-md mx-4",
                        style: {
                            border: "1px solid var(--stone-200)",
                            borderRadius: "var(--radius-lg, 14px)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 mb-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "inline-flex items-center justify-center w-10 h-10 rounded-full",
                                        style: {
                                            background: "var(--error-bg)"
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            className: "w-5 h-5",
                                            style: {
                                                color: "var(--error)"
                                            },
                                            fill: "none",
                                            stroke: "currentColor",
                                            viewBox: "0 0 24 24",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round",
                                                strokeWidth: 2,
                                                d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 1013,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/app/import/page.tsx",
                                            lineNumber: 1006,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 1002,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-lg font-bold",
                                        style: {
                                            color: "var(--stone-900)"
                                        },
                                        children: "Replace Existing Data?"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 1021,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 1001,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm mb-6",
                                style: {
                                    color: "var(--stone-500)"
                                },
                                children: "This will remove all existing opportunities and replace them with the data from this file. This action cannot be undone."
                            }, void 0, false, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 1025,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-end gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setShowReplaceConfirm(false),
                                        className: "inline-flex items-center px-4 py-2 text-sm font-semibold",
                                        style: {
                                            background: "#fff",
                                            color: "var(--stone-700)",
                                            border: "1px solid var(--stone-200)",
                                            borderRadius: "var(--radius-sm, 6px)"
                                        },
                                        "data-testid": "button-cancel-replace",
                                        children: "Cancel"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 1030,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: doImport,
                                        className: "inline-flex items-center px-4 py-2 text-sm font-semibold text-white",
                                        style: {
                                            background: "var(--error)",
                                            borderRadius: "var(--radius-sm, 6px)"
                                        },
                                        "data-testid": "button-confirm-replace",
                                        children: "Yes, Replace All Data"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 1043,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 1029,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/app/import/page.tsx",
                        lineNumber: 994,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/app/import/page.tsx",
                    lineNumber: 990,
                    columnNumber: 11
                }, this),
                step === "importing" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white p-6 text-center",
                    style: {
                        border: "1px solid var(--stone-200)",
                        borderRadius: "var(--radius-lg, 14px)"
                    },
                    "data-testid": "section-importing",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "inline-flex items-center justify-center w-10 h-10 rounded-full mb-4",
                            style: {
                                background: "var(--teal-50)"
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-5 h-5 animate-spin",
                                style: {
                                    color: "var(--teal-600)"
                                },
                                fill: "none",
                                viewBox: "0 0 24 24",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                        className: "opacity-25",
                                        cx: "12",
                                        cy: "12",
                                        r: "10",
                                        stroke: "currentColor",
                                        strokeWidth: "4"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 1076,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        className: "opacity-75",
                                        fill: "currentColor",
                                        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 1084,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 1070,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 1066,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm font-semibold",
                            style: {
                                color: "var(--stone-900)"
                            },
                            children: "Importing opportunities..."
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 1091,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs mt-1",
                            style: {
                                color: "var(--stone-500)"
                            },
                            children: "This may take a moment."
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 1094,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/app/import/page.tsx",
                    lineNumber: 1058,
                    columnNumber: 11
                }, this),
                step === "results" && importResult && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white",
                            style: {
                                border: "1px solid var(--stone-200)",
                                borderRadius: "var(--radius-lg, 14px)",
                                overflow: "hidden"
                            },
                            "data-testid": "section-results",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2.5 mb-5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                width: "20",
                                                height: "20",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                stroke: "var(--success)",
                                                strokeWidth: "2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M22 11.08V12a10 10 0 1 1-5.93-9.14"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 1122,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                        points: "22 4 12 14.01 9 11.01"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 1123,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 1114,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                className: "text-[15px] font-bold",
                                                style: {
                                                    color: "var(--stone-900)"
                                                },
                                                children: "Import Complete"
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 1125,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 1113,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid gap-4 sm:grid-cols-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bg-white p-5",
                                                style: {
                                                    border: "1px solid var(--stone-200)",
                                                    borderRadius: "var(--radius-md, 10px)"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs font-semibold uppercase mb-1",
                                                        style: {
                                                            color: "var(--stone-500)",
                                                            letterSpacing: "0.4px"
                                                        },
                                                        children: "Total Rows"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 1137,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-[28px] font-bold",
                                                        style: {
                                                            color: "var(--stone-900)",
                                                            letterSpacing: "-0.5px"
                                                        },
                                                        "data-testid": "text-total-rows",
                                                        children: importResult.totalRows
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 1143,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 1130,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bg-white p-5",
                                                style: {
                                                    border: "1px solid var(--stone-200)",
                                                    borderLeft: "3px solid var(--success)",
                                                    borderRadius: "var(--radius-md, 10px)"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs font-semibold uppercase mb-1",
                                                        style: {
                                                            color: "var(--stone-500)",
                                                            letterSpacing: "0.4px"
                                                        },
                                                        children: "Inserted"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 1159,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-[28px] font-bold",
                                                        style: {
                                                            color: "var(--success)",
                                                            letterSpacing: "-0.5px"
                                                        },
                                                        "data-testid": "text-inserted-count",
                                                        children: importResult.insertedCount
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 1165,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 1151,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bg-white p-5",
                                                style: {
                                                    border: "1px solid var(--stone-200)",
                                                    borderLeft: importResult.errorCount > 0 ? "3px solid var(--error)" : undefined,
                                                    borderRadius: "var(--radius-md, 10px)"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs font-semibold uppercase mb-1",
                                                        style: {
                                                            color: "var(--stone-500)",
                                                            letterSpacing: "0.4px"
                                                        },
                                                        children: "Errors"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 1182,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-[28px] font-bold",
                                                        style: {
                                                            color: importResult.errorCount > 0 ? "var(--error)" : "var(--stone-900)",
                                                            letterSpacing: "-0.5px"
                                                        },
                                                        "data-testid": "text-error-count",
                                                        children: importResult.errorCount
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 1188,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 1173,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 1129,
                                        columnNumber: 17
                                    }, this),
                                    importResult.enrichmentMapping && (Object.keys(importResult.enrichmentMapping.industry).length > 0 || Object.keys(importResult.enrichmentMapping.source).length > 0) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-5 px-4 py-3 rounded-md",
                                        style: {
                                            background: "var(--teal-50)",
                                            border: "1px solid var(--teal-200)"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs font-semibold",
                                                style: {
                                                    color: "var(--teal-800)"
                                                },
                                                children: "Enrichment applied"
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 1213,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs mt-0.5",
                                                style: {
                                                    color: "var(--teal-700)"
                                                },
                                                children: [
                                                    Object.keys(importResult.enrichmentMapping.industry).length > 0 && `${Object.keys(importResult.enrichmentMapping.industry).length} industry values → clusters. `,
                                                    Object.keys(importResult.enrichmentMapping.source).length > 0 && `${Object.keys(importResult.enrichmentMapping.source).length} source values → inbound/outbound.`,
                                                    " ",
                                                    "These appear as “Industry Cluster” and “Source Group” in your analytics."
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 1216,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 1206,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 1112,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 1103,
                            columnNumber: 13
                        }, this),
                        importResult.errors.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white",
                            style: {
                                border: "1px solid var(--stone-200)",
                                borderRadius: "var(--radius-lg, 14px)",
                                overflow: "hidden"
                            },
                            "data-testid": "section-error-details",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-sm font-semibold mb-4 flex items-center gap-2",
                                        style: {
                                            color: "var(--stone-800)"
                                        },
                                        children: [
                                            "Error Details",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                                                style: {
                                                    background: "var(--error-bg)",
                                                    color: "var(--error)"
                                                },
                                                children: [
                                                    importResult.errorCount,
                                                    " rows"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 1244,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 1239,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "overflow-x-auto",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                            className: "min-w-full text-[13px]",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        style: {
                                                            borderBottom: "1px solid var(--stone-200)"
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-4 py-2.5 text-left text-[11px] font-semibold uppercase",
                                                                style: {
                                                                    color: "var(--stone-500)",
                                                                    background: "var(--stone-50)",
                                                                    letterSpacing: "0.5px",
                                                                    width: "60px"
                                                                },
                                                                children: "Row"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 1255,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-4 py-2.5 text-left text-[11px] font-semibold uppercase",
                                                                style: {
                                                                    color: "var(--stone-500)",
                                                                    background: "var(--stone-50)",
                                                                    letterSpacing: "0.5px"
                                                                },
                                                                children: "Error"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 1266,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-4 py-2.5 text-left text-[11px] font-semibold uppercase",
                                                                style: {
                                                                    color: "var(--stone-500)",
                                                                    background: "var(--stone-50)",
                                                                    letterSpacing: "0.5px",
                                                                    width: "240px"
                                                                },
                                                                children: "Data"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 1276,
                                                                columnNumber: 27
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 1254,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 1253,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                    children: importResult.errors.map((err, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                            style: {
                                                                borderBottom: "1px solid var(--stone-100)"
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-4 py-3",
                                                                    "data-testid": `text-error-row-${i}`,
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "font-mono text-xs px-2 py-0.5 rounded",
                                                                        style: {
                                                                            background: "var(--stone-100)",
                                                                            color: "var(--stone-400)"
                                                                        },
                                                                        children: err.row_number
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/app/import/page.tsx",
                                                                        lineNumber: 1293,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/app/import/page.tsx",
                                                                    lineNumber: 1292,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-4 py-3",
                                                                    "data-testid": `text-error-msg-${i}`,
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-xs px-2 py-1 rounded inline-block",
                                                                        style: {
                                                                            background: "var(--error-bg)",
                                                                            color: "var(--error)"
                                                                        },
                                                                        children: err.error_message
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/app/import/page.tsx",
                                                                        lineNumber: 1304,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/app/import/page.tsx",
                                                                    lineNumber: 1303,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-4 py-3",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "font-mono text-[11px] max-w-[280px] truncate block",
                                                                        style: {
                                                                            color: "var(--stone-500)"
                                                                        },
                                                                        children: JSON.stringify(err.raw_row_json)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/app/import/page.tsx",
                                                                        lineNumber: 1312,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/app/import/page.tsx",
                                                                    lineNumber: 1311,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, i, true, {
                                                            fileName: "[project]/app/app/import/page.tsx",
                                                            lineNumber: 1291,
                                                            columnNumber: 27
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 1289,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/app/import/page.tsx",
                                            lineNumber: 1252,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 1251,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 1238,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 1229,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3 flex-wrap",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: handleReset,
                                    className: "inline-flex items-center px-5 py-2.5 text-[13px] font-semibold",
                                    style: {
                                        background: "#fff",
                                        color: "var(--stone-700)",
                                        border: "1px solid var(--stone-200)",
                                        borderRadius: "var(--radius-sm, 6px)"
                                    },
                                    "data-testid": "button-import-another",
                                    children: "Import Another File"
                                }, void 0, false, {
                                    fileName: "[project]/app/app/import/page.tsx",
                                    lineNumber: 1329,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: `/app/dashboard${importResult.jobId ? `?dataset=${importResult.jobId}` : ""}`,
                                    className: "inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white",
                                    style: {
                                        background: "var(--teal-600)",
                                        borderRadius: "var(--radius-sm, 6px)"
                                    },
                                    "data-testid": "link-view-analytics",
                                    children: [
                                        "View Analytics",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "16",
                                            height: "16",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            stroke: "currentColor",
                                            strokeWidth: "2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                    x1: "5",
                                                    y1: "12",
                                                    x2: "19",
                                                    y2: "12"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 1357,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                    points: "12 5 19 12 12 19"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 1358,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/app/import/page.tsx",
                                            lineNumber: 1349,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/app/import/page.tsx",
                                    lineNumber: 1342,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 1328,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/app/import/page.tsx",
                    lineNumber: 1102,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-12",
                    "data-testid": "section-import-history",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-lg font-bold mb-4",
                            style: {
                                color: "var(--stone-900)"
                            },
                            children: "Import History"
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 1367,
                            columnNumber: 11
                        }, this),
                        historyLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-center py-8",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-5 h-5 animate-spin",
                                style: {
                                    color: "var(--teal-600)"
                                },
                                fill: "none",
                                viewBox: "0 0 24 24",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                        className: "opacity-25",
                                        cx: "12",
                                        cy: "12",
                                        r: "10",
                                        stroke: "currentColor",
                                        strokeWidth: "4"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 1378,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        className: "opacity-75",
                                        fill: "currentColor",
                                        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/import/page.tsx",
                                        lineNumber: 1386,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 1372,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 1371,
                            columnNumber: 13
                        }, this) : importHistory.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white p-6 text-center",
                            style: {
                                border: "1px solid var(--stone-200)",
                                borderRadius: "var(--radius-lg, 14px)"
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm",
                                style: {
                                    color: "var(--stone-500)"
                                },
                                children: "No imports yet. Upload a CSV file above to get started."
                            }, void 0, false, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 1401,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 1394,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white overflow-hidden",
                            style: {
                                border: "1px solid var(--stone-200)",
                                borderRadius: "var(--radius-lg, 14px)"
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "overflow-x-auto",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                    className: "min-w-full text-[13px]",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                style: {
                                                    borderBottom: "1px solid var(--stone-200)"
                                                },
                                                children: [
                                                    "File",
                                                    "Mode",
                                                    "Status",
                                                    "Rows",
                                                    "Inserted",
                                                    "Errors",
                                                    "Date",
                                                    "Actions"
                                                ].map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                        className: `px-4 py-3 text-[11px] font-semibold uppercase ${[
                                                            "Rows",
                                                            "Inserted",
                                                            "Errors"
                                                        ].includes(h) ? "text-right" : "text-left"}`,
                                                        style: {
                                                            color: "var(--stone-500)",
                                                            background: "var(--stone-50)",
                                                            letterSpacing: "0.5px"
                                                        },
                                                        children: h
                                                    }, h, false, {
                                                        fileName: "[project]/app/app/import/page.tsx",
                                                        lineNumber: 1419,
                                                        columnNumber: 27
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/import/page.tsx",
                                                lineNumber: 1416,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/app/import/page.tsx",
                                            lineNumber: 1415,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                            children: importHistory.map((job)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    style: {
                                                        borderBottom: "1px solid var(--stone-100)",
                                                        opacity: !job.is_active ? 0.5 : 1
                                                    },
                                                    "data-testid": `import-job-${job.id}`,
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3 font-medium whitespace-nowrap max-w-[200px] truncate",
                                                            style: {
                                                                color: "var(--stone-900)"
                                                            },
                                                            children: job.filename
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/import/page.tsx",
                                                            lineNumber: 1446,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                                                style: {
                                                                    background: job.import_mode === "replace" ? "var(--warning-bg)" : "var(--info-bg)",
                                                                    color: job.import_mode === "replace" ? "var(--warning)" : "var(--teal-700)"
                                                                },
                                                                children: job.import_mode
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 1453,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/import/page.tsx",
                                                            lineNumber: 1452,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusBadge, {
                                                                status: job.status,
                                                                isActive: job.is_active
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 1470,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/import/page.tsx",
                                                            lineNumber: 1469,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3 text-right",
                                                            style: {
                                                                color: "var(--stone-700)"
                                                            },
                                                            children: job.row_count
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/import/page.tsx",
                                                            lineNumber: 1472,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3 text-right",
                                                            style: {
                                                                color: "var(--success)"
                                                            },
                                                            children: job.inserted_count
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/import/page.tsx",
                                                            lineNumber: 1475,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3 text-right",
                                                            style: {
                                                                color: job.error_count > 0 ? "var(--error)" : "var(--stone-700)"
                                                            },
                                                            children: job.error_count
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/import/page.tsx",
                                                            lineNumber: 1478,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3 whitespace-nowrap",
                                                            style: {
                                                                color: "var(--stone-500)"
                                                            },
                                                            children: [
                                                                new Date(job.created_at).toLocaleDateString(),
                                                                " ",
                                                                new Date(job.created_at).toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit"
                                                                })
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/app/import/page.tsx",
                                                            lineNumber: 1486,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3",
                                                            children: job.status === "completed" && job.is_active && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                                href: `/app/dashboard?dataset=${job.id}`,
                                                                className: "text-xs font-medium",
                                                                style: {
                                                                    color: "var(--teal-600)"
                                                                },
                                                                "data-testid": `link-analytics-${job.id}`,
                                                                children: "View Analytics"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/import/page.tsx",
                                                                lineNumber: 1498,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/import/page.tsx",
                                                            lineNumber: 1496,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, job.id, true, {
                                                    fileName: "[project]/app/app/import/page.tsx",
                                                    lineNumber: 1438,
                                                    columnNumber: 23
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/app/app/import/page.tsx",
                                            lineNumber: 1436,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/app/import/page.tsx",
                                    lineNumber: 1414,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/app/import/page.tsx",
                                lineNumber: 1413,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/app/import/page.tsx",
                            lineNumber: 1406,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/app/import/page.tsx",
                    lineNumber: 1366,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/app/import/page.tsx",
            lineNumber: 312,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/app/import/page.tsx",
        lineNumber: 311,
        columnNumber: 5
    }, this);
}
function StatusBadge({ status, isActive }) {
    if (!isActive) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
            style: {
                background: "var(--stone-100)",
                color: "var(--stone-500)"
            },
            children: "inactive"
        }, void 0, false, {
            fileName: "[project]/app/app/import/page.tsx",
            lineNumber: 1524,
            columnNumber: 7
        }, this);
    }
    const styles = {
        completed: {
            bg: "var(--success-bg)",
            color: "var(--success)"
        },
        running: {
            bg: "var(--info-bg)",
            color: "var(--teal-700)"
        },
        pending: {
            bg: "var(--warning-bg)",
            color: "var(--warning)"
        },
        failed: {
            bg: "var(--error-bg)",
            color: "var(--error)"
        }
    };
    const s = styles[status] || styles.pending;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
        style: {
            background: s.bg,
            color: s.color
        },
        children: status
    }, void 0, false, {
        fileName: "[project]/app/app/import/page.tsx",
        lineNumber: 1540,
        columnNumber: 5
    }, this);
}
function StepIndicator({ label, active, done, num }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-2.5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold",
                style: {
                    background: done && !active ? "var(--teal-600)" : active ? "var(--teal-50)" : "#fff",
                    color: done && !active ? "#fff" : active ? "var(--teal-600)" : "var(--stone-400)",
                    border: done && !active ? "2px solid var(--teal-600)" : active ? "2px solid var(--teal-600)" : "2px solid var(--stone-300)"
                },
                children: done && !active ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    width: "14",
                    height: "14",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: 3,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                        points: "20 6 9 17 4 12"
                    }, void 0, false, {
                        fileName: "[project]/app/app/import/page.tsx",
                        lineNumber: 1585,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/app/import/page.tsx",
                    lineNumber: 1577,
                    columnNumber: 11
                }, this) : num
            }, void 0, false, {
                fileName: "[project]/app/app/import/page.tsx",
                lineNumber: 1562,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-[13px] font-medium",
                style: {
                    color: active || done ? "var(--stone-700)" : "var(--stone-400)"
                },
                children: label
            }, void 0, false, {
                fileName: "[project]/app/app/import/page.tsx",
                lineNumber: 1591,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/app/import/page.tsx",
        lineNumber: 1561,
        columnNumber: 5
    }, this);
}
function StepDivider({ done }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            width: "40px",
            height: "2px",
            background: done ? "var(--teal-400)" : "var(--stone-200)",
            margin: "0 10px"
        }
    }, void 0, false, {
        fileName: "[project]/app/app/import/page.tsx",
        lineNumber: 1603,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=_0c1bf0a8._.js.map