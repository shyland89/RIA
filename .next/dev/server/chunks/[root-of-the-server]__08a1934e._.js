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
"[project]/app/api/analytics/summary/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$get$2d$user$2d$org$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/get-user-org.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$date$2d$filter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/date-filter.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
;
;
;
function buildBreakdown(opps, field) {
    const groups = new Map();
    for (const opp of opps){
        const key = opp[field] || "(empty)";
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
async function GET(request) {
    const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$get$2d$user$2d$org$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUserOrg"])();
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$get$2d$user$2d$org$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isUserOrgError"])(result)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: result.error
        }, {
            status: result.status
        });
    }
    const filterParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$date$2d$filter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseDateFilterFromSearchParams"])(request.nextUrl.searchParams);
    const filter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$date$2d$filter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveDateFilter"])(filterParams);
    const admin = createAdminClient();
    const { data: allOpps, error: countError } = await admin.from("opportunities").select("id", {
        count: "exact",
        head: true
    }).eq("org_id", result.membership.org_id);
    const totalOrgCount = countError ? 0 : allOpps?.length ?? 0;
    let query = admin.from("opportunities").select("name, role, industry, source, amount, outcome, closed_date, pipeline_accepted_date, created_at").eq("org_id", result.membership.org_id).not(filter.dateField, "is", null).gte(filter.dateField, filter.dateFrom).lte(filter.dateField, filter.dateTo);
    const { data: opportunities, error, count } = await query;
    if (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message
        }, {
            status: 500
        });
    }
    const { count: totalWithDateCount } = await admin.from("opportunities").select("id", {
        count: "exact",
        head: true
    }).eq("org_id", result.membership.org_id);
    const { count: nullDateCount } = await admin.from("opportunities").select("id", {
        count: "exact",
        head: true
    }).eq("org_id", result.membership.org_id).is(filter.dateField, null);
    const opps = opportunities || [];
    const total = opps.length;
    const won = opps.filter((o)=>o.outcome === "won");
    const lost = opps.filter((o)=>o.outcome === "lost");
    const decided = won.length + lost.length;
    const winRate = decided > 0 ? won.length / decided : null;
    const avgAmountWon = won.length > 0 ? won.reduce((sum, o)=>sum + Number(o.amount), 0) / won.length : null;
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        totals: {
            count: total,
            won: won.length,
            lost: lost.length,
            open: opps.filter((o)=>o.outcome === "open").length,
            winRate,
            avgAmountWon
        },
        byRole: buildBreakdown(opps, "role"),
        byIndustry: buildBreakdown(opps, "industry"),
        bySource: buildBreakdown(opps, "source"),
        filter: {
            dateMode: filter.dateField,
            dateModeLabel: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$date$2d$filter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DATE_MODE_LABELS"][filter.dateField],
            dateFrom: filter.dateFrom,
            dateTo: filter.dateTo,
            periodLabel: filter.periodLabel,
            includedCount: total,
            excludedNullCount: nullDateCount ?? 0,
            totalOrgCount: totalWithDateCount ?? 0
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__08a1934e._.js.map