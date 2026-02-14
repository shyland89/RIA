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
"[project]/app/api/admin/status/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$get$2d$user$2d$org$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/get-user-org.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
;
;
;
const REQUIRED_SCHEMA = {
    organizations: [
        "id",
        "name",
        "created_at"
    ],
    profiles: [
        "id",
        "email",
        "created_at"
    ],
    memberships: [
        "id",
        "org_id",
        "user_id",
        "role",
        "created_at"
    ],
    opportunities: [
        "id",
        "org_id",
        "import_job_id",
        "name",
        "role",
        "industry",
        "source",
        "amount",
        "outcome",
        "created_at",
        "closed_date",
        "pipeline_accepted_date",
        "segment",
        "country"
    ],
    import_jobs: [
        "id",
        "org_id",
        "user_id",
        "filename",
        "inserted_count",
        "error_count",
        "skipped_count",
        "row_count",
        "status",
        "is_active",
        "import_mode",
        "mapping_config",
        "started_at",
        "completed_at",
        "created_at"
    ],
    import_errors: [
        "id",
        "job_id",
        "row_number",
        "error_message",
        "raw_row_json",
        "created_at"
    ]
};
function createAdminClient() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(("TURBOPACK compile-time value", "https://hlzlrcutddjaiioaepef.supabase.co"), process.env.SUPABASE_SERVICE_ROLE_KEY);
}
async function GET() {
    const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$get$2d$user$2d$org$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUserOrg"])();
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$get$2d$user$2d$org$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isUserOrgError"])(result)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: result.error
        }, {
            status: result.status
        });
    }
    if (result.membership.role !== "admin") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Admin access required"
        }, {
            status: 403
        });
    }
    const admin = createAdminClient();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])();
    const orgId = result.membership.org_id;
    const userId = result.user.id;
    const checks = [];
    for (const [table, columns] of Object.entries(REQUIRED_SCHEMA)){
        const selectCols = columns.join(", ");
        const { error: selectError } = await admin.from(table).select(selectCols).limit(0);
        if (!selectError) {
            checks.push({
                id: `table-${table}`,
                label: `Table "${table}" with all columns`,
                category: "Schema",
                passed: true,
                message: `Table exists with all ${columns.length} required columns`
            });
        } else {
            const errMsg = selectError.message || "";
            const relationMissing = errMsg.includes("relation") && errMsg.includes("does not exist");
            if (relationMissing) {
                checks.push({
                    id: `table-${table}`,
                    label: `Table "${table}" exists`,
                    category: "Schema",
                    passed: false,
                    message: `Table "${table}" does not exist`,
                    fixSql: `-- Run the appropriate migration SQL to create the "${table}" table.\n-- See supabase/migrations/ directory for the correct CREATE TABLE statement.`
                });
                continue;
            }
            const colMatch = errMsg.match(/column (\w+)\.(\w+) does not exist/) || errMsg.match(/Could not find the .* column of '(\w+)' in the schema cache/) || errMsg.match(/column "?(\w+)"? does not exist/);
            if (colMatch) {
                checks.push({
                    id: `table-${table}`,
                    label: `Table "${table}" exists`,
                    category: "Schema",
                    passed: true,
                    message: "Table exists"
                });
                for (const col of columns){
                    const { error: singleColErr } = await admin.from(table).select(col).limit(0);
                    const colExists = !singleColErr;
                    checks.push({
                        id: `col-${table}-${col}`,
                        label: `Column "${table}.${col}"`,
                        category: "Schema",
                        passed: colExists,
                        message: colExists ? "Column found" : `Column "${col}" missing from "${table}"`,
                        fixSql: colExists ? undefined : `ALTER TABLE public.${table} ADD COLUMN "${col}" text;\n-- Adjust the data type as needed. Check migration files for the correct type.`
                    });
                }
            } else {
                checks.push({
                    id: `table-${table}`,
                    label: `Table "${table}" schema check`,
                    category: "Schema",
                    passed: false,
                    message: `Error checking "${table}": ${errMsg}`,
                    fixSql: `-- Investigate the error:\n-- ${errMsg}\n-- Check supabase/migrations/ for the expected schema.`
                });
            }
        }
    }
    try {
        const { data: memData, error: memError } = await supabase.from("memberships").select("id, role").eq("user_id", userId).limit(1).maybeSingle();
        if (memError) {
            const isRecursion = memError.message?.includes("infinite recursion") || memError.code === "42P17";
            checks.push({
                id: "rls-memberships-read",
                label: "Read own memberships (via RLS)",
                category: "Access",
                passed: false,
                message: isRecursion ? `RLS infinite recursion detected: ${memError.message}` : `Failed to read memberships: ${memError.message}`,
                fixSql: isRecursion ? `-- The memberships RLS policy references itself, causing infinite recursion.\n-- Fix by simplifying the SELECT policy to use auth.uid() directly:\n\nDROP POLICY IF EXISTS "Users can view own memberships" ON public.memberships;\nCREATE POLICY "Users can view own memberships"\n  ON public.memberships FOR SELECT\n  USING (user_id = auth.uid());` : `-- Check your RLS policies on memberships:\nSELECT schemaname, tablename, policyname, permissive, roles, cmd, qual\nFROM pg_policies WHERE tablename = 'memberships';`
            });
        } else {
            checks.push({
                id: "rls-memberships-read",
                label: "Read own memberships (via RLS)",
                category: "Access",
                passed: true,
                message: memData ? `OK (role: ${memData.role})` : "Query succeeded but no row found for current user"
            });
        }
    } catch (e) {
        checks.push({
            id: "rls-memberships-read",
            label: "Read own memberships (via RLS)",
            category: "Access",
            passed: false,
            message: `Unexpected error: ${e.message}`
        });
    }
    try {
        const { data: oppData, error: oppError } = await admin.from("opportunities").select("id").eq("org_id", orgId).limit(1);
        checks.push({
            id: "access-opportunities-read",
            label: "Read opportunities for org",
            category: "Access",
            passed: !oppError,
            message: oppError ? `Failed: ${oppError.message}` : `OK (${oppData?.length ?? 0} returned in sample)`,
            fixSql: oppError ? `-- Check RLS policies on opportunities:\nSELECT schemaname, tablename, policyname, permissive, roles, cmd, qual\nFROM pg_policies WHERE tablename = 'opportunities';` : undefined
        });
    } catch (e) {
        checks.push({
            id: "access-opportunities-read",
            label: "Read opportunities for org",
            category: "Access",
            passed: false,
            message: `Unexpected error: ${e.message}`
        });
    }
    try {
        const testJobData = {
            org_id: orgId,
            user_id: userId,
            filename: "__status_check_test__",
            inserted_count: 0,
            error_count: 0,
            skipped_count: 0,
            row_count: 0,
            status: "pending",
            is_active: false,
            import_mode: "append"
        };
        const { data: insertedJob, error: insertError } = await admin.from("import_jobs").insert(testJobData).select("id").single();
        if (insertError) {
            checks.push({
                id: "access-import-jobs-create",
                label: "Create import_jobs record",
                category: "Access",
                passed: false,
                message: `Failed: ${insertError.message}`,
                fixSql: `-- Check the import_jobs table structure:\nSELECT column_name, data_type, is_nullable\nFROM information_schema.columns\nWHERE table_name = 'import_jobs' AND table_schema = 'public'\nORDER BY ordinal_position;`
            });
        } else {
            await admin.from("import_jobs").delete().eq("id", insertedJob.id);
            checks.push({
                id: "access-import-jobs-create",
                label: "Create import_jobs record",
                category: "Access",
                passed: true,
                message: "Create and cleanup test record OK"
            });
        }
    } catch (e) {
        checks.push({
            id: "access-import-jobs-create",
            label: "Create import_jobs record",
            category: "Access",
            passed: false,
            message: `Unexpected error: ${e.message}`
        });
    }
    try {
        const { error: rlsError } = await supabase.from("memberships").select("id").limit(1);
        const isRecursion = rlsError?.message?.includes("infinite recursion") || rlsError?.code === "42P17";
        checks.push({
            id: "rls-recursion-check",
            label: "Memberships RLS recursion test",
            category: "RLS",
            passed: !isRecursion,
            message: isRecursion ? `Infinite recursion detected: ${rlsError?.message}` : rlsError ? `Non-recursion error: ${rlsError.message}` : "No recursion detected — RLS policies are clean",
            fixSql: isRecursion ? `-- The memberships RLS policy references itself, causing infinite recursion.\n-- Fix by using auth.uid() directly:\n\nDROP POLICY IF EXISTS "Users can view own memberships" ON public.memberships;\nCREATE POLICY "Users can view own memberships"\n  ON public.memberships FOR SELECT\n  USING (user_id = auth.uid());\n\n-- If other tables (e.g. organizations) reference memberships in their policies,\n-- use a SECURITY DEFINER function to avoid the recursion:\n\nCREATE OR REPLACE FUNCTION public.get_user_org_id()\nRETURNS uuid\nLANGUAGE sql\nSECURITY DEFINER\nSTABLE\nAS $$\n  SELECT org_id FROM public.memberships\n  WHERE user_id = auth.uid()\n  LIMIT 1;\n$$;` : undefined
        });
    } catch (e) {
        checks.push({
            id: "rls-recursion-check",
            label: "Memberships RLS recursion test",
            category: "RLS",
            passed: false,
            message: `Unexpected error: ${e.message}`
        });
    }
    const envChecks = [
        {
            key: "NEXT_PUBLIC_SUPABASE_URL",
            label: "Supabase URL configured"
        },
        {
            key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            label: "Supabase Anon Key configured"
        },
        {
            key: "SUPABASE_SERVICE_ROLE_KEY",
            label: "Service Role Key configured"
        },
        {
            key: "OPENAI_API_KEY",
            label: "OpenAI API Key configured"
        }
    ];
    for (const env of envChecks){
        const value = process.env[env.key];
        checks.push({
            id: `env-${env.key}`,
            label: env.label,
            category: "Environment",
            passed: !!value && value.length > 0,
            message: value ? "Set" : `Environment variable ${env.key} is not set`
        });
    }
    const passedCount = checks.filter((c)=>c.passed).length;
    const failedCount = checks.filter((c)=>!c.passed).length;
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        checks,
        summary: {
            total: checks.length,
            passed: passedCount,
            failed: failedCount,
            healthy: failedCount === 0
        },
        user: {
            id: userId,
            email: result.user.email,
            role: result.membership.role,
            orgId,
            orgName: result.org.name
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e9ecf9f0._.js.map