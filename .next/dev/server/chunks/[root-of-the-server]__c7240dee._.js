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
"[project]/app/api/import/execute/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$get$2d$user$2d$org$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/get-user-org.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$csv$2d$parse$2f$lib$2f$sync$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/csv-parse/lib/sync.js [app-route] (ecmascript) <locals>");
;
;
;
;
;
const REQUIRED_FIELDS = [
    "name",
    "role",
    "industry",
    "source",
    "amount",
    "outcome"
];
const VALID_OUTCOMES = [
    "open",
    "won",
    "lost"
];
const NULL_TOKENS = [
    "",
    "na",
    "n/a",
    "null",
    "none",
    "-"
];
function isNullish(val) {
    if (!val) return true;
    return NULL_TOKENS.includes(val.trim().toLowerCase());
}
function normalizeDimension(val) {
    if (!val) return null;
    const trimmed = val.trim();
    if (NULL_TOKENS.includes(trimmed.toLowerCase())) return null;
    return trimmed;
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
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])();
    const admin = createAdminClient();
    const user = result.user;
    const orgId = result.membership.org_id;
    const formData = await request.formData();
    const file = formData.get("file");
    const mappingJson = formData.get("mapping");
    const importMode = formData.get("mode") || "append";
    if (!file || !mappingJson) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "File and column mapping are required"
        }, {
            status: 400
        });
    }
    let mapping;
    try {
        mapping = JSON.parse(mappingJson);
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Invalid mapping format"
        }, {
            status: 400
        });
    }
    for (const field of REQUIRED_FIELDS){
        if (!mapping[field]) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `Missing mapping for required field: ${field}`
            }, {
                status: 400
            });
        }
    }
    const text = await file.text();
    let records;
    try {
        records = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$csv$2d$parse$2f$lib$2f$sync$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["parse"])(text, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true
        });
    } catch (e) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: `CSV parse error: ${e.message}`
        }, {
            status: 400
        });
    }
    const { data: job, error: jobError } = await admin.from("import_jobs").insert({
        org_id: orgId,
        user_id: user.id,
        filename: file.name,
        inserted_count: 0,
        error_count: 0,
        skipped_count: 0,
        row_count: records.length,
        status: "running",
        is_active: true,
        import_mode: importMode === "replace" ? "replace" : "append",
        mapping_config: mapping,
        started_at: new Date().toISOString()
    }).select("id").single();
    if (jobError || !job) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: `Failed to create import job: ${jobError?.message}`
        }, {
            status: 500
        });
    }
    const jobId = job.id;
    if (importMode === "replace") {
        await admin.from("import_jobs").update({
            is_active: false
        }).eq("org_id", orgId).neq("id", jobId);
        const { error: deleteError } = await admin.from("opportunities").delete().eq("org_id", orgId).is("import_job_id", null);
        if (deleteError) {
            console.error("Failed to delete unlinked opportunities:", deleteError.message);
        }
        const { data: priorJobs } = await admin.from("import_jobs").select("id").eq("org_id", orgId).eq("is_active", false);
        if (priorJobs && priorJobs.length > 0) {
            for (const pj of priorJobs){
                await admin.from("opportunities").delete().eq("org_id", orgId).eq("import_job_id", pj.id);
            }
        }
    }
    let insertedCount = 0;
    let skippedCount = 0;
    const errors = [];
    for(let i = 0; i < records.length; i++){
        const row = records[i];
        const rowNum = i + 2;
        const rowErrors = [];
        const name = row[mapping.name]?.trim() || "";
        const role = row[mapping.role]?.trim() || "";
        const industry = row[mapping.industry]?.trim() || "";
        const source = row[mapping.source]?.trim() || "";
        const amountStr = row[mapping.amount]?.trim() || "";
        const outcome = row[mapping.outcome]?.trim()?.toLowerCase() || "";
        const createdAtStr = mapping.created_at ? row[mapping.created_at]?.trim() : undefined;
        const closedDateStr = mapping.closed_date ? row[mapping.closed_date]?.trim() : undefined;
        const pipelineDateStr = mapping.pipeline_accepted_date ? row[mapping.pipeline_accepted_date]?.trim() : undefined;
        const segmentStr = mapping.segment ? row[mapping.segment]?.trim() : undefined;
        const countryStr = mapping.country ? row[mapping.country]?.trim() : undefined;
        if (!name) rowErrors.push("name is required");
        if (!role) rowErrors.push("role is required");
        if (!industry) rowErrors.push("industry is required");
        if (!source) rowErrors.push("source is required");
        const amount = parseFloat(amountStr);
        if (!amountStr || isNaN(amount)) {
            rowErrors.push("amount must be a valid number");
        }
        if (!VALID_OUTCOMES.includes(outcome)) {
            rowErrors.push(`outcome must be one of: ${VALID_OUTCOMES.join(", ")} (got "${outcome}")`);
        }
        let createdAt;
        if (createdAtStr && !isNullish(createdAtStr)) {
            const d = new Date(createdAtStr);
            if (isNaN(d.getTime())) {
                rowErrors.push("created_at is not a valid date");
            } else {
                createdAt = d.toISOString();
            }
        }
        let closedDate;
        if (closedDateStr && !isNullish(closedDateStr)) {
            const d = new Date(closedDateStr);
            if (isNaN(d.getTime())) {
                rowErrors.push("closed_date is not a valid date");
            } else {
                closedDate = d.toISOString();
            }
        }
        let pipelineAcceptedDate;
        if (pipelineDateStr && !isNullish(pipelineDateStr)) {
            const d = new Date(pipelineDateStr);
            if (isNaN(d.getTime())) {
                rowErrors.push("pipeline_accepted_date is not a valid date");
            } else {
                pipelineAcceptedDate = d.toISOString();
            }
        }
        if (rowErrors.length > 0) {
            errors.push({
                row_number: rowNum,
                error_message: rowErrors.join("; "),
                raw_row_json: row
            });
            continue;
        }
        const insertData = {
            org_id: orgId,
            import_job_id: jobId,
            name: name || null,
            role: normalizeDimension(role) ?? role,
            industry: normalizeDimension(industry) ?? industry,
            source: normalizeDimension(source) ?? source,
            amount,
            outcome,
            segment: normalizeDimension(segmentStr),
            country: normalizeDimension(countryStr)
        };
        if (createdAt) insertData.created_at = createdAt;
        if (closedDate) insertData.closed_date = closedDate;
        if (pipelineAcceptedDate) insertData.pipeline_accepted_date = pipelineAcceptedDate;
        const { error: insertError } = await admin.from("opportunities").insert(insertData);
        if (insertError) {
            errors.push({
                row_number: rowNum,
                error_message: insertError.message,
                raw_row_json: row
            });
        } else {
            insertedCount++;
        }
    }
    if (errors.length > 0) {
        const errorInserts = errors.map((e)=>({
                job_id: jobId,
                row_number: e.row_number,
                error_message: e.error_message,
                raw_row_json: e.raw_row_json
            }));
        await admin.from("import_errors").insert(errorInserts);
    }
    const finalStatus = insertedCount > 0 ? "completed" : errors.length > 0 ? "failed" : "completed";
    await admin.from("import_jobs").update({
        inserted_count: insertedCount,
        error_count: errors.length,
        skipped_count: skippedCount,
        status: finalStatus,
        completed_at: new Date().toISOString()
    }).eq("id", jobId);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        jobId,
        insertedCount,
        errorCount: errors.length,
        skippedCount,
        totalRows: records.length,
        errors: errors.slice(0, 50)
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c7240dee._.js.map