module.exports = [
"[project]/lib/date-filter.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DATE_MODES",
    ()=>DATE_MODES,
    "DATE_MODE_LABELS",
    ()=>DATE_MODE_LABELS,
    "PERIODS",
    ()=>PERIODS,
    "PERIOD_LABELS",
    ()=>PERIOD_LABELS,
    "parseDateFilterFromSearchParams",
    ()=>parseDateFilterFromSearchParams,
    "resolveDateFilter",
    ()=>resolveDateFilter
]);
const DATE_MODES = [
    "closed_date",
    "pipeline_accepted_date",
    "created_at"
];
const PERIODS = [
    "7d",
    "30d",
    "90d",
    "mtd",
    "qtd",
    "custom"
];
const DATE_MODE_LABELS = {
    closed_date: "Closed Date",
    pipeline_accepted_date: "Pipeline Accepted Date",
    created_at: "Created Date"
};
const PERIOD_LABELS = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    mtd: "Month to date",
    qtd: "Quarter to date",
    custom: "Custom range"
};
function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function quarterStart(d) {
    const q = Math.floor(d.getMonth() / 3) * 3;
    return new Date(d.getFullYear(), q, 1);
}
function resolveDateFilter(params) {
    const now = new Date();
    const dateField = DATE_MODES.includes(params.dateMode) ? params.dateMode : "created_at";
    const period = PERIODS.includes(params.period) ? params.period : "30d";
    let dateFrom;
    let dateTo = endOfDay(now);
    switch(period){
        case "7d":
            dateFrom = startOfDay(new Date(now.getTime() - 7 * 86400000));
            break;
        case "30d":
            dateFrom = startOfDay(new Date(now.getTime() - 30 * 86400000));
            break;
        case "90d":
            dateFrom = startOfDay(new Date(now.getTime() - 90 * 86400000));
            break;
        case "mtd":
            dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case "qtd":
            dateFrom = quarterStart(now);
            break;
        case "custom":
            dateFrom = params.from ? startOfDay(new Date(params.from)) : startOfDay(new Date(now.getTime() - 30 * 86400000));
            dateTo = params.to ? endOfDay(new Date(params.to)) : endOfDay(now);
            if (isNaN(dateFrom.getTime())) dateFrom = startOfDay(new Date(now.getTime() - 30 * 86400000));
            if (isNaN(dateTo.getTime())) dateTo = endOfDay(now);
            break;
        default:
            dateFrom = startOfDay(new Date(now.getTime() - 30 * 86400000));
    }
    return {
        dateField,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        periodLabel: period === "custom" ? `${dateFrom.toLocaleDateString()} – ${dateTo.toLocaleDateString()}` : PERIOD_LABELS[period]
    };
}
function parseDateFilterFromSearchParams(params) {
    return {
        dateMode: params.get("date_mode") || "created_at",
        period: params.get("period") || "30d",
        from: params.get("from") || undefined,
        to: params.get("to") || undefined
    };
}
}),
"[project]/lib/dimension-filter.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DIMENSION_KEYS",
    ()=>DIMENSION_KEYS,
    "DIMENSION_LABELS",
    ()=>DIMENSION_LABELS,
    "ENRICHED_DIMENSION_KEYS",
    ()=>ENRICHED_DIMENSION_KEYS,
    "RAW_DIMENSION_KEYS",
    ()=>RAW_DIMENSION_KEYS,
    "UNKNOWN_VALUE",
    ()=>UNKNOWN_VALUE,
    "applyDimensionFiltersInMemory",
    ()=>applyDimensionFiltersInMemory,
    "describeDimensionFilters",
    ()=>describeDimensionFilters,
    "dimensionFiltersToSearchParams",
    ()=>dimensionFiltersToSearchParams,
    "hasActiveDimensionFilters",
    ()=>hasActiveDimensionFilters,
    "parseDimensionFiltersFromBody",
    ()=>parseDimensionFiltersFromBody,
    "parseDimensionFiltersFromSearchParams",
    ()=>parseDimensionFiltersFromSearchParams
]);
const DIMENSION_KEYS = [
    "segment",
    "country",
    "source",
    "industry",
    "role",
    "industry_cluster",
    "source_group"
];
const DIMENSION_LABELS = {
    segment: "Segment",
    country: "Country",
    source: "Source",
    industry: "Industry",
    role: "Champion Role",
    industry_cluster: "Industry Cluster",
    source_group: "Source Group"
};
const ENRICHED_DIMENSION_KEYS = [
    "industry_cluster",
    "source_group"
];
const RAW_DIMENSION_KEYS = [
    "segment",
    "country",
    "source",
    "industry",
    "role"
];
const UNKNOWN_VALUE = "Unknown";
function parseDimensionFiltersFromSearchParams(params) {
    const filters = {};
    for (const key of DIMENSION_KEYS){
        const values = params.getAll(key);
        if (values.length > 0) {
            filters[key] = values;
        }
    }
    return filters;
}
function parseDimensionFiltersFromBody(body) {
    const filters = {};
    for (const key of DIMENSION_KEYS){
        if (Array.isArray(body[key]) && body[key].length > 0) {
            filters[key] = body[key].map((v)=>String(v));
        }
    }
    return filters;
}
function applyDimensionFiltersInMemory(items, filters) {
    let filtered = items;
    for (const [key, values] of Object.entries(filters)){
        if (!values || values.length === 0) continue;
        const hasUnknown = values.includes(UNKNOWN_VALUE);
        const nonUnknownValues = values.filter((v)=>v !== UNKNOWN_VALUE);
        filtered = filtered.filter((item)=>{
            const val = item[key];
            if (val === null || val === undefined || val === "") {
                return hasUnknown;
            }
            return nonUnknownValues.includes(val);
        });
    }
    return filtered;
}
function hasActiveDimensionFilters(filters) {
    return Object.values(filters).some((v)=>v && v.length > 0);
}
function describeDimensionFilters(filters) {
    const parts = [];
    for (const key of DIMENSION_KEYS){
        const values = filters[key];
        if (values && values.length > 0) {
            parts.push(`${DIMENSION_LABELS[key]}: ${values.join(", ")}`);
        }
    }
    return parts.length > 0 ? parts.join(" | ") : "None";
}
function dimensionFiltersToSearchParams(filters, params) {
    for (const key of DIMENSION_KEYS){
        params.delete(key);
        const values = filters[key];
        if (values && values.length > 0) {
            for (const v of values){
                params.append(key, v);
            }
        }
    }
}
}),
"[project]/app/app/dashboard/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DashboardPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$date$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/date-filter.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/dimension-filter.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
function fmtPct(v) {
    if (v === null) return "\u2014";
    return `${(v * 100).toFixed(1)}%`;
}
function fmtCurrency(v) {
    if (v === null) return "\u2014";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(v);
}
function DashboardPage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Suspense"], {
        fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-background flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    className: "w-5 h-5 text-primary animate-spin",
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
                            fileName: "[project]/app/app/dashboard/page.tsx",
                            lineNumber: 118,
                            columnNumber: 13
                        }, void 0),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            className: "opacity-75",
                            fill: "currentColor",
                            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        }, void 0, false, {
                            fileName: "[project]/app/app/dashboard/page.tsx",
                            lineNumber: 119,
                            columnNumber: 13
                        }, void 0)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/app/dashboard/page.tsx",
                    lineNumber: 117,
                    columnNumber: 11
                }, void 0)
            }, void 0, false, {
                fileName: "[project]/app/app/dashboard/page.tsx",
                lineNumber: 116,
                columnNumber: 9
            }, void 0)
        }, void 0, false, {
            fileName: "[project]/app/app/dashboard/page.tsx",
            lineNumber: 115,
            columnNumber: 7
        }, void 0),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DashboardContent, {}, void 0, false, {
            fileName: "[project]/app/app/dashboard/page.tsx",
            lineNumber: 124,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/app/dashboard/page.tsx",
        lineNumber: 114,
        columnNumber: 5
    }, this);
}
function DashboardContent() {
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const dateMode = searchParams.get("date_mode") || "created_at";
    const period = searchParams.get("period") || "30d";
    const customFrom = searchParams.get("from") || "";
    const customTo = searchParams.get("to") || "";
    const datasetParam = searchParams.get("dataset") || "";
    const initialDimFilters = {};
    for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DIMENSION_KEYS"]){
        const vals = searchParams.getAll(key);
        if (vals.length > 0) initialDimFilters[key] = vals;
    }
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [aiAnalysis, setAiAnalysis] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [aiLoading, setAiLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [aiError, setAiError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [dimFilters, setDimFilters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(initialDimFilters);
    const [dimOptions, setDimOptions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [filtersOpen, setFiltersOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>{
        return Object.values(initialDimFilters).some((v)=>v && v.length > 0);
    });
    const [datasets, setDatasets] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedDataset, setSelectedDataset] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(datasetParam);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        async function loadDatasets() {
            try {
                const res = await fetch("/api/import/jobs");
                if (res.ok) {
                    const json = await res.json();
                    const activeCompleted = (json.jobs || []).filter((j)=>j.is_active && j.status === "completed" && j.inserted_count > 0).map((j)=>({
                            id: j.id,
                            filename: j.filename,
                            inserted_count: j.inserted_count,
                            created_at: j.created_at
                        }));
                    setDatasets(activeCompleted);
                }
            } catch  {}
        }
        loadDatasets();
    }, []);
    function handleDatasetChange(newDataset) {
        setSelectedDataset(newDataset);
        const params = new URLSearchParams(searchParams.toString());
        if (newDataset) {
            params.set("dataset", newDataset);
        } else {
            params.delete("dataset");
        }
        router.replace(`?${params.toString()}`, {
            scroll: false
        });
    }
    function updateFilter(updates) {
        const params = new URLSearchParams(searchParams.toString());
        for (const [k, v] of Object.entries(updates)){
            if (v) {
                params.set(k, v);
            } else {
                params.delete(k);
            }
        }
        if (params.get("period") !== "custom") {
            params.delete("from");
            params.delete("to");
        }
        if (selectedDataset) {
            params.set("dataset", selectedDataset);
        }
        for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DIMENSION_KEYS"]){
            params.delete(key);
            const vals = dimFilters[key];
            if (vals) {
                for (const v of vals)params.append(key, v);
            }
        }
        router.replace(`?${params.toString()}`, {
            scroll: false
        });
    }
    function syncDimFiltersToUrl(newFilters) {
        const params = new URLSearchParams(searchParams.toString());
        for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DIMENSION_KEYS"]){
            params.delete(key);
            const vals = newFilters[key];
            if (vals && vals.length > 0) {
                for (const v of vals)params.append(key, v);
            }
        }
        router.replace(`?${params.toString()}`, {
            scroll: false
        });
    }
    function toggleDimValue(dim, value) {
        setDimFilters((prev)=>{
            const current = prev[dim] || [];
            const next = current.includes(value) ? current.filter((v)=>v !== value) : [
                ...current,
                value
            ];
            const updated = {
                ...prev,
                [dim]: next.length > 0 ? next : undefined
            };
            if (next.length === 0) delete updated[dim];
            syncDimFiltersToUrl(updated);
            return updated;
        });
    }
    function clearAllDimFilters() {
        setDimFilters({});
        const params = new URLSearchParams(searchParams.toString());
        for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DIMENSION_KEYS"])params.delete(key);
        router.replace(`?${params.toString()}`, {
            scroll: false
        });
    }
    const activeDimFilterCount = Object.values(dimFilters).reduce((sum, vals)=>sum + (vals?.length || 0), 0);
    const fetchDimensions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        try {
            const params = new URLSearchParams();
            params.set("date_mode", dateMode);
            params.set("period", period);
            if (period === "custom") {
                if (customFrom) params.set("from", customFrom);
                if (customTo) params.set("to", customTo);
            }
            if (selectedDataset) params.set("dataset", selectedDataset);
            const res = await fetch(`/api/analytics/dimensions?${params.toString()}`);
            if (res.ok) {
                const json = await res.json();
                setDimOptions(json.dimensions || {});
            }
        } catch  {}
    }, [
        dateMode,
        period,
        customFrom,
        customTo,
        selectedDataset
    ]);
    const fetchData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            params.set("date_mode", dateMode);
            params.set("period", period);
            if (period === "custom") {
                if (customFrom) params.set("from", customFrom);
                if (customTo) params.set("to", customTo);
            }
            if (selectedDataset) params.set("dataset", selectedDataset);
            for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DIMENSION_KEYS"]){
                const vals = dimFilters[key];
                if (vals && vals.length > 0) {
                    for (const v of vals)params.append(key, v);
                }
            }
            const res = await fetch(`/api/analytics/summary?${params.toString()}`);
            if (!res.ok) {
                const body = await res.json().catch(()=>({}));
                setError(body.error || "Failed to load analytics");
                return;
            }
            setData(await res.json());
        } catch  {
            setError("Failed to load analytics");
        } finally{
            setLoading(false);
        }
    }, [
        dateMode,
        period,
        customFrom,
        customTo,
        dimFilters,
        selectedDataset
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        fetchDimensions();
    }, [
        fetchDimensions
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        fetchData();
    }, [
        fetchData
    ]);
    async function runAiAnalysis() {
        setAiLoading(true);
        setAiError("");
        setAiAnalysis(null);
        try {
            const body = {
                date_mode: dateMode,
                period: period
            };
            if (period === "custom") {
                if (customFrom) body.from = customFrom;
                if (customTo) body.to = customTo;
            }
            if (selectedDataset) body.dataset = selectedDataset;
            for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DIMENSION_KEYS"]){
                const vals = dimFilters[key];
                if (vals && vals.length > 0) {
                    body[key] = vals;
                }
            }
            const res = await fetch("/api/ai/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                const json = await res.json().catch(()=>({}));
                setAiError(json.error || "AI analysis failed");
                return;
            }
            const json = await res.json();
            setAiAnalysis(json.analysis);
        } catch  {
            setAiError("AI analysis failed. Please try again.");
        } finally{
            setAiLoading(false);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-background",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "border-b border-border",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 flex-wrap",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-4 h-4 text-primary-foreground",
                                        fill: "none",
                                        stroke: "currentColor",
                                        viewBox: "0 0 24 24",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: 2,
                                            d: "M13 10V3L4 14h7v7l9-11h-7z"
                                        }, void 0, false, {
                                            fileName: "[project]/app/app/dashboard/page.tsx",
                                            lineNumber: 366,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 365,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/app/dashboard/page.tsx",
                                    lineNumber: 364,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-sm font-semibold text-foreground",
                                    "data-testid": "text-dashboard-title",
                                    children: "Analytics Dashboard"
                                }, void 0, false, {
                                    fileName: "[project]/app/app/dashboard/page.tsx",
                                    lineNumber: 369,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/app/dashboard/page.tsx",
                            lineNumber: 363,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3 flex-wrap",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/app/import",
                                    className: "text-sm text-muted-foreground hover:text-foreground transition-colors",
                                    "data-testid": "link-import",
                                    children: "Import"
                                }, void 0, false, {
                                    fileName: "[project]/app/app/dashboard/page.tsx",
                                    lineNumber: 374,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/app",
                                    className: "text-sm text-muted-foreground hover:text-foreground transition-colors",
                                    "data-testid": "link-home",
                                    children: "Home"
                                }, void 0, false, {
                                    fileName: "[project]/app/app/dashboard/page.tsx",
                                    lineNumber: 381,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/app/dashboard/page.tsx",
                            lineNumber: 373,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/app/dashboard/page.tsx",
                    lineNumber: 362,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/app/dashboard/page.tsx",
                lineNumber: 361,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-md border border-border bg-card p-4 mb-4",
                        "data-testid": "filter-bar",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap items-end gap-4",
                                children: [
                                    datasets.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col gap-1.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "text-xs font-medium text-muted-foreground",
                                                htmlFor: "dataset-select",
                                                children: "Dataset"
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 398,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                id: "dataset-select",
                                                value: selectedDataset,
                                                onChange: (e)=>handleDatasetChange(e.target.value),
                                                className: "rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30",
                                                "data-testid": "select-dataset",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "",
                                                        children: "All Data"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                        lineNumber: 408,
                                                        columnNumber: 19
                                                    }, this),
                                                    datasets.map((ds)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: ds.id,
                                                            children: [
                                                                ds.filename,
                                                                " (",
                                                                ds.inserted_count,
                                                                " rows)"
                                                            ]
                                                        }, ds.id, true, {
                                                            fileName: "[project]/app/app/dashboard/page.tsx",
                                                            lineNumber: 410,
                                                            columnNumber: 21
                                                        }, this))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 401,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 397,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col gap-1.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "text-xs font-medium text-muted-foreground",
                                                htmlFor: "date-mode",
                                                children: "Date Mode"
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 419,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                id: "date-mode",
                                                value: dateMode,
                                                onChange: (e)=>updateFilter({
                                                        date_mode: e.target.value
                                                    }),
                                                className: "rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30",
                                                "data-testid": "select-date-mode",
                                                children: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$date$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DATE_MODES"].map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: m,
                                                        children: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$date$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DATE_MODE_LABELS"][m]
                                                    }, m, false, {
                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                        lineNumber: 430,
                                                        columnNumber: 19
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 422,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 418,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col gap-1.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "text-xs font-medium text-muted-foreground",
                                                htmlFor: "period",
                                                children: "Time Period"
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 438,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                id: "period",
                                                value: period,
                                                onChange: (e)=>updateFilter({
                                                        period: e.target.value
                                                    }),
                                                className: "rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30",
                                                "data-testid": "select-period",
                                                children: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$date$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PERIODS"].map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: p,
                                                        children: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$date$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PERIOD_LABELS"][p]
                                                    }, p, false, {
                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                        lineNumber: 449,
                                                        columnNumber: 19
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 441,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 437,
                                        columnNumber: 13
                                    }, this),
                                    period === "custom" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-col gap-1.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "text-xs font-medium text-muted-foreground",
                                                        htmlFor: "custom-from",
                                                        children: "From"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                        lineNumber: 459,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "date",
                                                        id: "custom-from",
                                                        value: customFrom,
                                                        onChange: (e)=>updateFilter({
                                                                from: e.target.value
                                                            }),
                                                        className: "rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30",
                                                        "data-testid": "input-date-from"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                        lineNumber: 462,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 458,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-col gap-1.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "text-xs font-medium text-muted-foreground",
                                                        htmlFor: "custom-to",
                                                        children: "To"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                        lineNumber: 472,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "date",
                                                        id: "custom-to",
                                                        value: customTo,
                                                        onChange: (e)=>updateFilter({
                                                                to: e.target.value
                                                            }),
                                                        className: "rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30",
                                                        "data-testid": "input-date-to"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                        lineNumber: 475,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 471,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setFiltersOpen((v)=>!v),
                                        className: `inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${activeDimFilterCount > 0 ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground"}`,
                                        "data-testid": "button-toggle-filters",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: "w-4 h-4",
                                                fill: "none",
                                                stroke: "currentColor",
                                                viewBox: "0 0 24 24",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: 2,
                                                    d: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/dashboard/page.tsx",
                                                    lineNumber: 497,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 496,
                                                columnNumber: 15
                                            }, this),
                                            "Filters",
                                            activeDimFilterCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1",
                                                children: activeDimFilterCount
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 501,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: `w-3 h-3 transition-transform ${filtersOpen ? "rotate-180" : ""}`,
                                                fill: "none",
                                                stroke: "currentColor",
                                                viewBox: "0 0 24 24",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: 2,
                                                    d: "M19 9l-7 7-7-7"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/dashboard/page.tsx",
                                                    lineNumber: 506,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 505,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 487,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 395,
                                columnNumber: 11
                            }, this),
                            data?.filter && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground",
                                "data-testid": "filter-meta",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            "Showing ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                className: "text-foreground",
                                                children: data.filter.includedCount
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 514,
                                                columnNumber: 25
                                            }, this),
                                            " opportunities"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 513,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            data.filter.dateModeLabel,
                                            ": ",
                                            new Date(data.filter.dateFrom).toLocaleDateString(),
                                            " – ",
                                            new Date(data.filter.dateTo).toLocaleDateString()
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 516,
                                        columnNumber: 15
                                    }, this),
                                    data.filter.excludedNullCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            "(",
                                            data.filter.excludedNullCount,
                                            " excluded — missing ",
                                            data.filter.dateModeLabel.toLowerCase(),
                                            ")"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 520,
                                        columnNumber: 17
                                    }, this),
                                    selectedDataset && datasets.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        "data-testid": "text-active-dataset",
                                        children: [
                                            "Dataset: ",
                                            datasets.find((d)=>d.id === selectedDataset)?.filename || "Selected"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 525,
                                        columnNumber: 17
                                    }, this),
                                    data.filter.activeDimensionFilters && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        "data-testid": "text-active-dim-filters",
                                        children: [
                                            "Filtered by: ",
                                            data.filter.activeDimensionFilters
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 530,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 512,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/app/dashboard/page.tsx",
                        lineNumber: 394,
                        columnNumber: 9
                    }, this),
                    filtersOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-md border border-border bg-card p-4 mb-8",
                        "data-testid": "dimension-filters-panel",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between gap-4 flex-wrap mb-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-xs font-medium text-muted-foreground uppercase tracking-wide",
                                        children: "Dimension Filters"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 542,
                                        columnNumber: 15
                                    }, this),
                                    activeDimFilterCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: clearAllDimFilters,
                                        className: "text-xs text-primary hover:underline",
                                        "data-testid": "button-clear-all-filters",
                                        children: "Clear all"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 546,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 541,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
                                children: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DIMENSION_KEYS"].map((dim)=>{
                                    const options = dimOptions[dim] || [];
                                    const selected = dimFilters[dim] || [];
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        "data-testid": `dim-filter-${dim}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs font-medium text-foreground mb-2",
                                                children: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DIMENSION_LABELS"][dim]
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 561,
                                                columnNumber: 21
                                            }, this),
                                            options.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-muted-foreground",
                                                children: "No values"
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 563,
                                                columnNumber: 23
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-1 max-h-40 overflow-y-auto pr-1",
                                                children: options.map((val)=>{
                                                    const isChecked = selected.includes(val);
                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "flex items-center gap-2 cursor-pointer text-xs text-foreground hover:bg-muted/40 rounded px-1 py-0.5",
                                                        "data-testid": `dim-option-${dim}-${val}`,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "checkbox",
                                                                checked: isChecked,
                                                                onChange: ()=>toggleDimValue(dim, val),
                                                                className: "rounded border-border text-primary focus:ring-primary/30 h-3.5 w-3.5"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                                lineNumber: 574,
                                                                columnNumber: 31
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: val === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UNKNOWN_VALUE"] ? "italic text-muted-foreground" : "",
                                                                children: val
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                                lineNumber: 580,
                                                                columnNumber: 31
                                                            }, this)
                                                        ]
                                                    }, val, true, {
                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                        lineNumber: 569,
                                                        columnNumber: 29
                                                    }, this);
                                                })
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 565,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, dim, true, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 560,
                                        columnNumber: 19
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 555,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/app/dashboard/page.tsx",
                        lineNumber: 540,
                        columnNumber: 11
                    }, this),
                    !filtersOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-8"
                    }, void 0, false, {
                        fileName: "[project]/app/app/dashboard/page.tsx",
                        lineNumber: 595,
                        columnNumber: 26
                    }, this),
                    loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-center py-20",
                        "data-testid": "loading-state",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-5 h-5 text-primary animate-spin",
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
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 601,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        className: "opacity-75",
                                        fill: "currentColor",
                                        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 602,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 600,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/app/dashboard/page.tsx",
                            lineNumber: 599,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/app/dashboard/page.tsx",
                        lineNumber: 598,
                        columnNumber: 11
                    }, this),
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-md border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400",
                        "data-testid": "text-error",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/app/app/dashboard/page.tsx",
                        lineNumber: 609,
                        columnNumber: 11
                    }, this),
                    !loading && !error && data && data.totals.count === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center py-20",
                        "data-testid": "empty-state",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "w-7 h-7 text-muted-foreground",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        strokeWidth: 1.5,
                                        d: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 618,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/app/dashboard/page.tsx",
                                    lineNumber: 617,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 616,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-lg font-semibold text-foreground mb-1",
                                children: "No opportunities found"
                            }, void 0, false, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 621,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-muted-foreground mb-6 max-w-md mx-auto",
                                children: "No data matches the selected filters. Try adjusting the date mode, time period, or dimension filters, or import opportunities from CSV."
                            }, void 0, false, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 622,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/app/import",
                                className: "inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
                                "data-testid": "link-import-cta",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-4 h-4 mr-2",
                                        fill: "none",
                                        stroke: "currentColor",
                                        viewBox: "0 0 24 24",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: 2,
                                            d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                        }, void 0, false, {
                                            fileName: "[project]/app/app/dashboard/page.tsx",
                                            lineNumber: 631,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 630,
                                        columnNumber: 15
                                    }, this),
                                    "Import Opportunities"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 625,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/app/dashboard/page.tsx",
                        lineNumber: 615,
                        columnNumber: 11
                    }, this),
                    !loading && !error && data && data.totals.count > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-2xl font-semibold tracking-tight text-foreground",
                                        children: "Analytics"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 641,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-muted-foreground mt-1",
                                        children: "Performance overview of your opportunities pipeline."
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 644,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 640,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
                                "data-testid": "kpi-cards",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(KpiCard, {
                                        label: "Total Opportunities",
                                        value: String(data.totals.count),
                                        sub: `${data.totals.open} open \u00B7 ${data.totals.won} won \u00B7 ${data.totals.lost} lost`,
                                        testId: "kpi-total"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 651,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(KpiCard, {
                                        label: "Win Rate",
                                        value: fmtPct(data.totals.winRate),
                                        sub: data.totals.winRate !== null ? `${data.totals.won} won of ${data.totals.won + data.totals.lost} decided` : "No decided deals yet",
                                        testId: "kpi-winrate"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 657,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(KpiCard, {
                                        label: "Avg Amount (Won)",
                                        value: fmtCurrency(data.totals.avgAmountWon),
                                        sub: data.totals.avgAmountWon !== null ? `From ${data.totals.won} won deals` : "No won deals yet",
                                        testId: "kpi-avgamount"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 663,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(KpiCard, {
                                        label: "Open Pipeline",
                                        value: String(data.totals.open),
                                        sub: "Opportunities in progress",
                                        testId: "kpi-open"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 669,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 650,
                                columnNumber: 13
                            }, this),
                            (()=>{
                                const c = data.coverage;
                                const breakdowns = [
                                    {
                                        title: "By Champion Role",
                                        rows: data.byRole,
                                        testId: "breakdown-role",
                                        dim: "role",
                                        label: "champion role"
                                    },
                                    {
                                        title: "By Industry",
                                        rows: data.byIndustry,
                                        testId: "breakdown-industry",
                                        dim: "industry",
                                        label: "industry"
                                    },
                                    {
                                        title: "By Source",
                                        rows: data.bySource,
                                        testId: "breakdown-source",
                                        dim: "source",
                                        label: "source"
                                    },
                                    {
                                        title: "By Segment",
                                        rows: data.bySegment,
                                        testId: "breakdown-segment",
                                        dim: "segment",
                                        label: "segment"
                                    },
                                    {
                                        title: "By Country",
                                        rows: data.byCountry,
                                        testId: "breakdown-country",
                                        dim: "country",
                                        label: "country"
                                    }
                                ];
                                const visible = breakdowns.filter((b)=>!c || c[b.dim]?.sufficient !== false);
                                const hidden = breakdowns.filter((b)=>c && c[b.dim]?.sufficient === false);
                                const topRow = visible.slice(0, 3);
                                const bottomRow = visible.slice(3);
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        topRow.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `grid gap-6 ${topRow.length === 1 ? "" : topRow.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`,
                                            children: topRow.map((b)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BreakdownTable, {
                                                    title: b.title,
                                                    rows: b.rows,
                                                    testId: b.testId
                                                }, b.testId, false, {
                                                    fileName: "[project]/app/app/dashboard/page.tsx",
                                                    lineNumber: 696,
                                                    columnNumber: 25
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/app/app/dashboard/page.tsx",
                                            lineNumber: 694,
                                            columnNumber: 21
                                        }, this),
                                        bottomRow.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `grid gap-6 ${bottomRow.length === 1 ? "" : "lg:grid-cols-2"}`,
                                            children: bottomRow.map((b)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BreakdownTable, {
                                                    title: b.title,
                                                    rows: b.rows,
                                                    testId: b.testId
                                                }, b.testId, false, {
                                                    fileName: "[project]/app/app/dashboard/page.tsx",
                                                    lineNumber: 703,
                                                    columnNumber: 25
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/app/app/dashboard/page.tsx",
                                            lineNumber: 701,
                                            columnNumber: 21
                                        }, this),
                                        hidden.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "rounded-md border border-border bg-muted/30 p-4",
                                            "data-testid": "hidden-breakdowns-note",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-muted-foreground",
                                                children: [
                                                    hidden.map((b)=>b.title).join(", "),
                                                    " breakdown",
                                                    hidden.length > 1 ? "s" : "",
                                                    " hidden:",
                                                    " ",
                                                    hidden.map((b)=>`${b.label} not provided in this dataset`).join("; "),
                                                    "."
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 709,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/app/dashboard/page.tsx",
                                            lineNumber: 708,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true);
                            })(),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-md border border-border bg-card p-6",
                                "data-testid": "ai-analysis-section",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between gap-4 flex-wrap mb-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary/10",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            className: "w-4 h-4 text-primary",
                                                            fill: "none",
                                                            stroke: "currentColor",
                                                            viewBox: "0 0 24 24",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                strokeWidth: 2,
                                                                d: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                                lineNumber: 725,
                                                                columnNumber: 23
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/dashboard/page.tsx",
                                                            lineNumber: 724,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                        lineNumber: 723,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                className: "text-sm font-medium text-foreground",
                                                                children: "AI-Powered Analysis"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                                lineNumber: 729,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-xs text-muted-foreground",
                                                                children: [
                                                                    "Analyzing with ",
                                                                    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$date$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DATE_MODE_LABELS"][dateMode],
                                                                    " · ",
                                                                    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$date$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PERIOD_LABELS"][period],
                                                                    activeDimFilterCount > 0 && ` \u00B7 ${activeDimFilterCount} filter${activeDimFilterCount > 1 ? "s" : ""} active`
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                                lineNumber: 730,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                        lineNumber: 728,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 722,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: runAiAnalysis,
                                                disabled: aiLoading,
                                                className: "inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                                                "data-testid": "button-ai-analyze",
                                                children: aiLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            className: "w-4 h-4 mr-2 animate-spin",
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
                                                                    fileName: "[project]/app/app/dashboard/page.tsx",
                                                                    lineNumber: 745,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    className: "opacity-75",
                                                                    fill: "currentColor",
                                                                    d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/app/dashboard/page.tsx",
                                                                    lineNumber: 746,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/app/dashboard/page.tsx",
                                                            lineNumber: 744,
                                                            columnNumber: 23
                                                        }, this),
                                                        "Analyzing..."
                                                    ]
                                                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            className: "w-4 h-4 mr-2",
                                                            fill: "none",
                                                            stroke: "currentColor",
                                                            viewBox: "0 0 24 24",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                strokeWidth: 2,
                                                                d: "M13 10V3L4 14h7v7l9-11h-7z"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                                lineNumber: 753,
                                                                columnNumber: 25
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/dashboard/page.tsx",
                                                            lineNumber: 752,
                                                            columnNumber: 23
                                                        }, this),
                                                        "Analyze with AI"
                                                    ]
                                                }, void 0, true)
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 736,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 721,
                                        columnNumber: 15
                                    }, this),
                                    aiError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "rounded-md border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 mb-4",
                                        "data-testid": "text-ai-error",
                                        children: aiError
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 762,
                                        columnNumber: 17
                                    }, this),
                                    !aiAnalysis && !aiLoading && !aiError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-muted-foreground",
                                        "data-testid": "text-ai-placeholder",
                                        children: "Click the button above to generate AI-powered insights for the current filters."
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 768,
                                        columnNumber: 17
                                    }, this),
                                    aiAnalysis && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-6",
                                        "data-testid": "ai-results",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                "data-testid": "ai-summary",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-foreground leading-relaxed",
                                                    children: aiAnalysis.summary
                                                }, void 0, false, {
                                                    fileName: "[project]/app/app/dashboard/page.tsx",
                                                    lineNumber: 777,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 776,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AiStageCard, {
                                                        title: "Open Pipeline",
                                                        section: aiAnalysis.openPipeline,
                                                        accentColor: "blue",
                                                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            className: "w-4 h-4",
                                                            fill: "none",
                                                            stroke: "currentColor",
                                                            viewBox: "0 0 24 24",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                strokeWidth: 2,
                                                                d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                                lineNumber: 788,
                                                                columnNumber: 27
                                                            }, void 0)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/dashboard/page.tsx",
                                                            lineNumber: 787,
                                                            columnNumber: 25
                                                        }, void 0),
                                                        testId: "ai-stage-open"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                        lineNumber: 782,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AiStageCard, {
                                                        title: "Closed Won",
                                                        section: aiAnalysis.closedWon,
                                                        accentColor: "green",
                                                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            className: "w-4 h-4",
                                                            fill: "none",
                                                            stroke: "currentColor",
                                                            viewBox: "0 0 24 24",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                strokeWidth: 2,
                                                                d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                                lineNumber: 799,
                                                                columnNumber: 27
                                                            }, void 0)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/dashboard/page.tsx",
                                                            lineNumber: 798,
                                                            columnNumber: 25
                                                        }, void 0),
                                                        testId: "ai-stage-won"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                        lineNumber: 793,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AiStageCard, {
                                                        title: "Closed Lost",
                                                        section: aiAnalysis.closedLost,
                                                        accentColor: "red",
                                                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            className: "w-4 h-4",
                                                            fill: "none",
                                                            stroke: "currentColor",
                                                            viewBox: "0 0 24 24",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                strokeWidth: 2,
                                                                d: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                                lineNumber: 810,
                                                                columnNumber: 27
                                                            }, void 0)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/app/dashboard/page.tsx",
                                                            lineNumber: 809,
                                                            columnNumber: 25
                                                        }, void 0),
                                                        testId: "ai-stage-lost"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                        lineNumber: 804,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 781,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                "data-testid": "ai-recommendations",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                        className: "text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3",
                                                        children: "Recommendations"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                        lineNumber: 819,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "space-y-2",
                                                        children: aiAnalysis.recommendations.map((rec, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-start gap-3 rounded-md border border-border bg-muted/20 px-4 py-3",
                                                                "data-testid": `ai-rec-${i}`,
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "inline-flex items-center justify-center min-w-[24px] h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold",
                                                                        children: i + 1
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                                        lineNumber: 827,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-sm text-foreground leading-relaxed",
                                                                        children: rec
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                                        lineNumber: 830,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                ]
                                                            }, i, true, {
                                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                                lineNumber: 822,
                                                                columnNumber: 25
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                                        lineNumber: 820,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/app/dashboard/page.tsx",
                                                lineNumber: 818,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 774,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 720,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/app/dashboard/page.tsx",
                        lineNumber: 639,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/app/dashboard/page.tsx",
                lineNumber: 392,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/app/dashboard/page.tsx",
        lineNumber: 360,
        columnNumber: 5
    }, this);
}
/* ─── Stage Section Card ─── */ const ACCENT_STYLES = {
    blue: {
        header: "border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900",
        iconBg: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
        title: "text-blue-900 dark:text-blue-200",
        headline: "text-blue-800 dark:text-blue-300"
    },
    green: {
        header: "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900",
        iconBg: "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400",
        title: "text-green-900 dark:text-green-200",
        headline: "text-green-800 dark:text-green-300"
    },
    red: {
        header: "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900",
        iconBg: "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400",
        title: "text-red-900 dark:text-red-200",
        headline: "text-red-800 dark:text-red-300"
    }
};
const INSIGHT_TYPE_STYLES = {
    strength: {
        border: "border-l-green-500",
        label: "STRENGTH",
        labelColor: "text-green-600 dark:text-green-400"
    },
    risk: {
        border: "border-l-red-500",
        label: "RISK",
        labelColor: "text-red-600 dark:text-red-400"
    },
    pattern: {
        border: "border-l-blue-500",
        label: "PATTERN",
        labelColor: "text-blue-600 dark:text-blue-400"
    }
};
function AiStageCard({ title, section, accentColor, icon, testId }) {
    const styles = ACCENT_STYLES[accentColor];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-md border border-border overflow-hidden",
        "data-testid": testId,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `px-4 py-3 border-b ${styles.header}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 mb-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `inline-flex items-center justify-center w-6 h-6 rounded-md ${styles.iconBg}`,
                                children: icon
                            }, void 0, false, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 906,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: `text-sm font-semibold ${styles.title}`,
                                children: title
                            }, void 0, false, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 909,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/app/dashboard/page.tsx",
                        lineNumber: 905,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: `text-xs leading-relaxed ${styles.headline}`,
                        children: section.headline
                    }, void 0, false, {
                        fileName: "[project]/app/app/dashboard/page.tsx",
                        lineNumber: 911,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/app/dashboard/page.tsx",
                lineNumber: 904,
                columnNumber: 7
            }, this),
            section.insights.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "divide-y divide-border/50",
                children: section.insights.map((insight, i)=>{
                    const typeStyle = INSIGHT_TYPE_STYLES[insight.type] || INSIGHT_TYPE_STYLES.pattern;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `px-4 py-3 border-l-[3px] ${typeStyle.border}`,
                        "data-testid": `${testId}-insight-${i}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 mb-0.5",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: `text-[10px] font-semibold tracking-wide ${typeStyle.labelColor}`,
                                    children: typeStyle.label
                                }, void 0, false, {
                                    fileName: "[project]/app/app/dashboard/page.tsx",
                                    lineNumber: 926,
                                    columnNumber: 19
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 925,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs font-medium text-foreground",
                                children: insight.title
                            }, void 0, false, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 930,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-muted-foreground leading-relaxed mt-0.5",
                                children: insight.description
                            }, void 0, false, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 931,
                                columnNumber: 17
                            }, this)
                        ]
                    }, i, true, {
                        fileName: "[project]/app/app/dashboard/page.tsx",
                        lineNumber: 920,
                        columnNumber: 15
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/app/app/dashboard/page.tsx",
                lineNumber: 916,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 py-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-xs text-muted-foreground",
                    children: "No deals in this stage for the selected filters."
                }, void 0, false, {
                    fileName: "[project]/app/app/dashboard/page.tsx",
                    lineNumber: 938,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/app/dashboard/page.tsx",
                lineNumber: 937,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/app/dashboard/page.tsx",
        lineNumber: 902,
        columnNumber: 5
    }, this);
}
/* ─── Shared Components ─── */ function KpiCard({ label, value, sub, testId }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-md border border-border bg-card p-5",
        "data-testid": testId,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs font-medium text-muted-foreground",
                children: label
            }, void 0, false, {
                fileName: "[project]/app/app/dashboard/page.tsx",
                lineNumber: 950,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-2xl font-semibold text-foreground mt-1",
                children: value
            }, void 0, false, {
                fileName: "[project]/app/app/dashboard/page.tsx",
                lineNumber: 951,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-muted-foreground mt-1",
                children: sub
            }, void 0, false, {
                fileName: "[project]/app/app/dashboard/page.tsx",
                lineNumber: 952,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/app/dashboard/page.tsx",
        lineNumber: 949,
        columnNumber: 5
    }, this);
}
function BreakdownTable({ title, rows, testId }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-md border border-border bg-card p-5",
        "data-testid": testId,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-sm font-medium text-foreground mb-3",
                children: title
            }, void 0, false, {
                fileName: "[project]/app/app/dashboard/page.tsx",
                lineNumber: 960,
                columnNumber: 7
            }, this),
            rows.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-muted-foreground",
                children: "No data"
            }, void 0, false, {
                fileName: "[project]/app/app/dashboard/page.tsx",
                lineNumber: 962,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "overflow-x-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    className: "min-w-full text-xs",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                className: "border-b border-border",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "text-left py-2 pr-3 font-medium text-muted-foreground",
                                        children: title.replace("By ", "")
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 968,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "text-right py-2 px-2 font-medium text-muted-foreground",
                                        children: "Count"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 969,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "text-right py-2 px-2 font-medium text-muted-foreground",
                                        children: "Win Rate"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 970,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "text-right py-2 pl-2 font-medium text-muted-foreground",
                                        children: "Avg Amt"
                                    }, void 0, false, {
                                        fileName: "[project]/app/app/dashboard/page.tsx",
                                        lineNumber: 971,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/app/dashboard/page.tsx",
                                lineNumber: 967,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/app/dashboard/page.tsx",
                            lineNumber: 966,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: rows.map((row)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    className: "border-b border-border/50",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: `py-2 pr-3 font-medium whitespace-nowrap ${row.label === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UNKNOWN_VALUE"] ? "text-muted-foreground italic" : "text-foreground"}`,
                                            children: row.label
                                        }, void 0, false, {
                                            fileName: "[project]/app/app/dashboard/page.tsx",
                                            lineNumber: 977,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 px-2 text-right text-foreground",
                                            children: row.count
                                        }, void 0, false, {
                                            fileName: "[project]/app/app/dashboard/page.tsx",
                                            lineNumber: 980,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 px-2 text-right text-foreground",
                                            children: fmtPct(row.winRate)
                                        }, void 0, false, {
                                            fileName: "[project]/app/app/dashboard/page.tsx",
                                            lineNumber: 981,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 pl-2 text-right text-foreground",
                                            children: fmtCurrency(row.avgAmountWon)
                                        }, void 0, false, {
                                            fileName: "[project]/app/app/dashboard/page.tsx",
                                            lineNumber: 982,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, row.label, true, {
                                    fileName: "[project]/app/app/dashboard/page.tsx",
                                    lineNumber: 976,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/app/app/dashboard/page.tsx",
                            lineNumber: 974,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/app/dashboard/page.tsx",
                    lineNumber: 965,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/app/dashboard/page.tsx",
                lineNumber: 964,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/app/dashboard/page.tsx",
        lineNumber: 959,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=_ecf9264a._.js.map