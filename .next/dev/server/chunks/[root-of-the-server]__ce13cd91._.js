module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/supabase/server.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createClient",
    ()=>createClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
;
;
async function createClient() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])(("TURBOPACK compile-time value", "https://hlzlrcutddjaiioaepef.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsemxyY3V0ZGRqYWlpb2FlcGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDk3NzEsImV4cCI6MjA4NjMyNTc3MX0.HoNR34ZAwEVij0q3FJtVj-mypLu7H9MdhsOXk-jvDKQ"), {
        cookies: {
            getAll () {
                return cookieStore.getAll();
            },
            setAll (cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options })=>cookieStore.set(name, value, options));
                } catch  {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing user sessions.
                }
            }
        }
    });
}
}),
"[project]/lib/get-user-org.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getUserOrg",
    ()=>getUserOrg,
    "isUserOrgError",
    ()=>isUserOrgError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
;
;
function createAdminClient() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(("TURBOPACK compile-time value", "https://hlzlrcutddjaiioaepef.supabase.co"), process.env.SUPABASE_SERVICE_ROLE_KEY);
}
async function getUserOrg() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return {
            error: "Unauthorized",
            status: 401
        };
    }
    const admin = createAdminClient();
    const { data: membership, error: memError } = await admin.from("memberships").select("org_id, role").eq("user_id", user.id).limit(1).maybeSingle();
    if (memError || !membership) {
        return {
            error: "No membership found. You may need to create an organization or contact support.",
            status: 403
        };
    }
    const { data: org, error: orgError } = await admin.from("organizations").select("id, name").eq("id", membership.org_id).limit(1).maybeSingle();
    if (orgError || !org) {
        return {
            error: "Organization record not found. Please contact support.",
            status: 500
        };
    }
    return {
        user: {
            id: user.id,
            email: user.email ?? ""
        },
        membership: {
            org_id: membership.org_id,
            role: membership.role
        },
        org: {
            id: org.id,
            name: org.name
        }
    };
}
function isUserOrgError(result) {
    return "error" in result;
}
}),
"[project]/lib/date-filter.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/lib/dimension-filter.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DIMENSION_KEYS",
    ()=>DIMENSION_KEYS,
    "DIMENSION_LABELS",
    ()=>DIMENSION_LABELS,
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
    "role"
];
const DIMENSION_LABELS = {
    segment: "Segment",
    country: "Country",
    source: "Source",
    industry: "Industry",
    role: "Champion Role"
};
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
"[project]/app/api/ai/analyze/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$get$2d$user$2d$org$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/get-user-org.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$date$2d$filter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/date-filter.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/dimension-filter.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/openai/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__OpenAI__as__default$3e$__ = __turbopack_context__.i("[project]/node_modules/openai/client.mjs [app-route] (ecmascript) <export OpenAI as default>");
;
;
;
;
;
;
function buildBreakdown(opps, field) {
    const groups = new Map();
    for (const opp of opps){
        const rawVal = opp[field];
        const key = rawVal === null || rawVal === undefined || rawVal === "" ? __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UNKNOWN_VALUE"] : String(rawVal);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(opp);
    }
    const rows = [];
    for (const [label, items] of groups){
        const won = items.filter((o)=>o.outcome === "won");
        const lost = items.filter((o)=>o.outcome === "lost");
        const open = items.filter((o)=>o.outcome === "open");
        const decided = won.length + lost.length;
        const winRate = decided > 0 ? won.length / decided : null;
        const avgAmountWon = won.length > 0 ? won.reduce((sum, o)=>sum + Number(o.amount), 0) / won.length : null;
        rows.push({
            label,
            count: items.length,
            won: won.length,
            lost: lost.length,
            open: open.length,
            winRate,
            avgAmountWon
        });
    }
    return rows.sort((a, b)=>b.count - a.count);
}
function createAdminClient() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(("TURBOPACK compile-time value", "https://hlzlrcutddjaiioaepef.supabase.co"), process.env.SUPABASE_SERVICE_ROLE_KEY);
}
async function POST(request) {
    const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$get$2d$user$2d$org$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUserOrg"])();
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$get$2d$user$2d$org$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isUserOrgError"])(result)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: result.error
        }, {
            status: result.status
        });
    }
    let body = {};
    try {
        body = await request.json();
    } catch  {}
    const filterParams = {
        dateMode: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$date$2d$filter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DATE_MODES"].includes(body.date_mode) ? body.date_mode : "created_at",
        period: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$date$2d$filter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PERIODS"].includes(body.period) ? body.period : "30d",
        from: body.from,
        to: body.to
    };
    const filter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$date$2d$filter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveDateFilter"])(filterParams);
    const dimFilters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseDimensionFiltersFromBody"])(body);
    const datasetId = body.dataset || null;
    const admin = createAdminClient();
    let query = admin.from("opportunities").select("name, role, industry, source, segment, country, amount, outcome").eq("org_id", result.membership.org_id).not(filter.dateField, "is", null).gte(filter.dateField, filter.dateFrom).lte(filter.dateField, filter.dateTo);
    if (datasetId) query = query.eq("import_job_id", datasetId);
    const { data: opportunities, error } = await query;
    if (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message
        }, {
            status: 500
        });
    }
    let opps = opportunities || [];
    let nullQuery = admin.from("opportunities").select("id", {
        count: "exact",
        head: true
    }).eq("org_id", result.membership.org_id).is(filter.dateField, null);
    if (datasetId) nullQuery = nullQuery.eq("import_job_id", datasetId);
    const { count: nullDateCount } = await nullQuery;
    const hasDimFilters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasActiveDimensionFilters"])(dimFilters);
    if (hasDimFilters) {
        opps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyDimensionFiltersInMemory"])(opps, dimFilters);
    }
    if (opps.length === 0) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "No opportunities found for the selected filters. Try adjusting the date range or dimension filters, or import data first."
        }, {
            status: 400
        });
    }
    const total = opps.length;
    const won = opps.filter((o)=>o.outcome === "won");
    const lost = opps.filter((o)=>o.outcome === "lost");
    const openCount = opps.filter((o)=>o.outcome === "open").length;
    const decided = won.length + lost.length;
    const winRate = decided > 0 ? won.length / decided : null;
    const avgAmountWon = won.length > 0 ? won.reduce((sum, o)=>sum + Number(o.amount), 0) / won.length : null;
    const COVERAGE_MIN_COUNT = 5;
    const COVERAGE_MIN_PCT = 0.2;
    function hasSufficientCoverage(field) {
        const nonNull = opps.filter((o)=>o[field] !== null && o[field] !== undefined && o[field] !== "").length;
        const pct = total > 0 ? nonNull / total : 0;
        return nonNull >= COVERAGE_MIN_COUNT && pct >= COVERAGE_MIN_PCT;
    }
    const allDims = [
        {
            key: "byRole",
            field: "role",
            label: "Champion Role"
        },
        {
            key: "byIndustry",
            field: "industry",
            label: "Industry"
        },
        {
            key: "bySource",
            field: "source",
            label: "Source"
        },
        {
            key: "bySegment",
            field: "segment",
            label: "Segment"
        },
        {
            key: "byCountry",
            field: "country",
            label: "Country"
        }
    ];
    const includedDims = allDims.filter((d)=>hasSufficientCoverage(d.field));
    const excludedDims = allDims.filter((d)=>!hasSufficientCoverage(d.field));
    const analyticsPayload = {
        totals: {
            count: total,
            won: won.length,
            lost: lost.length,
            open: openCount,
            winRate,
            avgAmountWon
        }
    };
    for (const dim of includedDims){
        analyticsPayload[dim.key] = buildBreakdown(opps, dim.field);
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "OpenAI API key not configured"
        }, {
            status: 500
        });
    }
    const openai = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__OpenAI__as__default$3e$__["default"]({
        apiKey
    });
    const dateModeLabel = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$date$2d$filter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DATE_MODE_LABELS"][filter.dateField];
    const dimFilterDesc = hasDimFilters ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dimension$2d$filter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["describeDimensionFilters"])(dimFilters) : null;
    let dateContext = `Date Mode: ${dateModeLabel}\nTime Window: ${filter.periodLabel} (${new Date(filter.dateFrom).toLocaleDateString()} to ${new Date(filter.dateTo).toLocaleDateString()})\nOpportunities analyzed: ${total}\nExcluded (missing ${dateModeLabel}): ${nullDateCount ?? 0}`;
    if (datasetId) {
        dateContext += `\nDataset: Import job ${datasetId}`;
    }
    if (dimFilterDesc) {
        dateContext += `\nActive Dimension Filters: ${dimFilterDesc}`;
    }
    if (excludedDims.length > 0) {
        dateContext += `\nNote: The following dimensions have insufficient data coverage and are excluded from the analysis: ${excludedDims.map((d)=>d.label).join(", ")}. Do NOT analyze or reference these dimensions.`;
    }
    if (includedDims.length > 0) {
        dateContext += `\nAvailable breakdown dimensions: ${includedDims.map((d)=>d.label).join(", ")}`;
    }
    const filterMentionRule = dimFilterDesc ? `- Your summary MUST mention: the date mode (${dateModeLabel}), the time window (${filter.periodLabel}), the number of opportunities (${total}), and the active dimension filters (${dimFilterDesc})` : `- Your summary MUST mention: the date mode (${dateModeLabel}), the time window (${filter.periodLabel}), and the number of opportunities (${total})`;
    const systemPrompt = `You are a senior sales analytics consultant. You receive JSON data about a company's sales opportunities pipeline and provide actionable insights organized by deal stage.

The data has been filtered by a specific date mode and time window.${hasDimFilters ? " Additionally, dimension filters have been applied to narrow the dataset." : ""}${datasetId ? " The data comes from a specific imported dataset." : ""} Always state which date mode and time window you are analyzing in your summary.${hasDimFilters ? " Also mention the active dimension filters." : ""}

Respond ONLY with a valid JSON object matching this exact structure:
{
  "summary": "A 2-3 sentence executive summary of the overall pipeline health. Must mention the date mode, time window, and number of opportunities analyzed.${hasDimFilters ? " Must also mention the active dimension filters." : ""}",
  "openPipeline": {
    "headline": "One sentence summarizing the open pipeline status (count, total value, key risks or opportunities).",
    "insights": [
      {
        "title": "Short insight title",
        "description": "1-2 sentence explanation with specific numbers from the data.",
        "type": "strength | risk | pattern"
      }
    ]
  },
  "closedWon": {
    "headline": "One sentence summarizing closed-won performance (count, win rate, avg deal size, top patterns).",
    "insights": [
      {
        "title": "Short insight title",
        "description": "1-2 sentence explanation with specific numbers from the data.",
        "type": "strength | risk | pattern"
      }
    ]
  },
  "closedLost": {
    "headline": "One sentence summarizing closed-lost patterns (count, loss rate, common failure points).",
    "insights": [
      {
        "title": "Short insight title",
        "description": "1-2 sentence explanation with specific numbers from the data.",
        "type": "strength | risk | pattern"
      }
    ]
  },
  "recommendations": [
    "Specific actionable recommendation based on the data."
  ]
}

Rules:
- Each stage section (openPipeline, closedWon, closedLost) should have 1-3 insights relevant to THAT stage
- If a stage has zero deals, still include the section but with a headline noting zero deals and an empty insights array
- Provide exactly 3-5 recommendations that synthesize findings across all stages
- Each insight type should be: "strength" (positive signal), "risk" (concern or red flag), or "pattern" (neutral observation worth noting)
- Reference specific numbers, percentages, and labels from the data
- Keep language professional and concise
- Open Pipeline insights should focus on: pipeline value at risk, concentration risks, conversion likelihood based on historical patterns
- Closed Won insights should focus on: what's working, winning segments/sources/roles, deal size patterns
- Closed Lost insights should focus on: failure patterns, segments/sources/roles that consistently lose, deal size vs loss correlation
${filterMentionRule}${excludedDims.length > 0 ? `\n- Do NOT mention or analyze these excluded dimensions (insufficient data): ${excludedDims.map((d)=>d.label).join(", ")}` : ""}
- Do NOT include any text outside the JSON object`;
    const userPrompt = `${dateContext}\n\nAnalyze this sales pipeline data and provide stage-grouped insights:\n\n${JSON.stringify(analyticsPayload)}`;
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
        const rawText = response.output_text;
        const parsed = JSON.parse(rawText);
        if (!parsed.summary || !parsed.openPipeline || !parsed.closedWon || !parsed.closedLost || !Array.isArray(parsed.recommendations)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "AI returned an unexpected response format"
            }, {
                status: 500
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            analysis: parsed,
            filter: {
                dateMode: filter.dateField,
                dateModeLabel,
                dateFrom: filter.dateFrom,
                dateTo: filter.dateTo,
                periodLabel: filter.periodLabel,
                analyzedCount: total,
                excludedNullCount: nullDateCount ?? 0,
                datasetId,
                activeDimensionFilters: dimFilterDesc
            }
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "AI analysis failed";
        console.error("OpenAI API error:", message);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: `AI analysis failed: ${message}`
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ce13cd91._.js.map