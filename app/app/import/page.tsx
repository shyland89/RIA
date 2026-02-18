"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { INDUSTRY_CLUSTERS, SOURCE_GROUP_LABELS } from "@/lib/enrichment";

type UploadResult = {
  headers: string[];
  preview: Record<string, string>[];
  totalRows: number;
  filename: string;
};

type ImportResult = {
  jobId: string;
  insertedCount: number;
  errorCount: number;
  skippedCount: number;
  totalRows: number;
  errors: {
    row_number: number;
    error_message: string;
    raw_row_json: Record<string, string>;
  }[];
  enrichmentMapping?: {
    industry: Record<string, string>;
    source: Record<string, string>;
  };
};

type ImportJob = {
  id: string;
  filename: string;
  status: string;
  row_count: number;
  inserted_count: number;
  error_count: number;
  skipped_count: number;
  is_active: boolean;
  import_mode: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
};

type EnrichmentMapping = {
  industry: Record<string, string>;
  source: Record<string, string>;
};

const NOT_PROVIDED = "__not_provided__";

const TARGET_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "amount", label: "Amount", required: true },
  { key: "outcome", label: "Outcome", required: true },
  { key: "role", label: "Champion Role", required: false },
  { key: "industry", label: "Industry", required: false },
  { key: "source", label: "Source", required: false },
  { key: "created_at", label: "Created At", required: false, isDate: true },
  { key: "closed_date", label: "Closed Date", required: false, isDate: true },
  { key: "pipeline_accepted_date", label: "Pipeline Accepted Date", required: false, isDate: true },
  { key: "segment", label: "Segment", required: false },
  { key: "country", label: "Country", required: false },
];

type Step = "upload" | "mapping" | "enrichment" | "importing" | "results";

export default function ImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Enrichment state
  const [enrichmentMapping, setEnrichmentMapping] = useState<EnrichmentMapping>({
    industry: {},
    source: {},
  });
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);
  const [enrichmentError, setEnrichmentError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
    } catch {}
    setHistoryLoading(false);
  }

  async function handleUpload() {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        setUploading(false);
        return;
      }
      setUploadResult(data);
      const autoMapping: Record<string, string> = {};
      for (const field of TARGET_FIELDS) {
        const match = data.headers.find(
          (h: string) => h.toLowerCase().replace(/[_\s-]/g, "") === field.key.replace(/_/g, "")
        );
        if (match) autoMapping[field.key] = match;
      }
      setMapping(autoMapping);
      setStep("mapping");
    } catch {
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleMappingChange(targetField: string, csvHeader: string) {
    setMapping((prev) => ({ ...prev, [targetField]: csvHeader }));
  }

  function isMappingValid(): boolean {
    const requiredOk = TARGET_FIELDS.filter((f) => f.required).every(
      (f) => mapping[f.key] && mapping[f.key] !== "" && mapping[f.key] !== NOT_PROVIDED
    );
    const dateFields = TARGET_FIELDS.filter((f) => (f as any).isDate);
    const hasAtLeastOneDate = dateFields.some(
      (f) => mapping[f.key] && mapping[f.key] !== "" && mapping[f.key] !== NOT_PROVIDED
    );
    return requiredOk && hasAtLeastOneDate;
  }

  function getMappingWarnings(): string[] {
    const warnings: string[] = [];
    const dateFields = TARGET_FIELDS.filter((f) => (f as any).isDate);
    const hasDate = dateFields.some(
      (f) => mapping[f.key] && mapping[f.key] !== "" && mapping[f.key] !== NOT_PROVIDED
    );
    if (!hasDate)
      warnings.push(
        "At least one date field (Created At, Closed Date, or Pipeline Accepted Date) is required."
      );
    return warnings;
  }

  // ─── Enrichment Preview ────────────────────────────────────────────────────

  async function handleProceedToEnrichment() {
    if (!uploadResult) return;

    const hasIndustry =
      mapping.industry && mapping.industry !== "" && mapping.industry !== NOT_PROVIDED;
    const hasSource =
      mapping.source && mapping.source !== "" && mapping.source !== NOT_PROVIDED;

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
      const industries = hasIndustry
        ? [
            ...new Set(
              uploadResult.preview
                .map((r) => r[mapping.industry]?.trim())
                .filter((v): v is string => !!v && v !== "")
            ),
          ]
        : [];

      const sources = hasSource
        ? [
            ...new Set(
              uploadResult.preview
                .map((r) => r[mapping.source]?.trim())
                .filter((v): v is string => !!v && v !== "")
            ),
          ]
        : [];

      const res = await fetch("/api/import/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industries, sources }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEnrichmentError(data.error || "Classification failed");
        return;
      }

      setEnrichmentMapping(data.enrichmentMapping);
    } catch {
      setEnrichmentError("Classification failed. You can adjust manually or skip.");
    } finally {
      setEnrichmentLoading(false);
    }
  }

  function updateIndustryCluster(rawValue: string, newCluster: string) {
    setEnrichmentMapping((prev) => ({
      ...prev,
      industry: { ...prev.industry, [rawValue]: newCluster },
    }));
  }

  function updateSourceGroup(rawValue: string, newGroup: string) {
    setEnrichmentMapping((prev) => ({
      ...prev,
      source: { ...prev.source, [rawValue]: newGroup },
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
      const cleanMapping: Record<string, string> = {};
      for (const [key, val] of Object.entries(mapping)) {
        if (val && val !== "" && val !== NOT_PROVIDED) cleanMapping[key] = val;
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mapping", JSON.stringify(cleanMapping));
      formData.append("enrichment_mapping", JSON.stringify(enrichmentMapping));
      formData.append("mode", importMode);
      const res = await fetch("/api/import/execute", { method: "POST", body: formData });
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
    } catch {
      setError("Import failed. Please try again.");
      setStep("mapping");
    } finally {
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
    setEnrichmentMapping({ industry: {}, source: {} });
    setEnrichmentError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const selectStyle = {
    border: "1px solid var(--stone-200)",
    borderRadius: "var(--radius-sm, 6px)",
    color: "var(--stone-700)",
    background: "var(--stone-50)",
  };

  const isEnrichmentStep = step === "enrichment";
  const isDoneStep = step === "importing" || step === "results";

  return (
    <div className="min-h-screen" style={{ background: "var(--stone-50)" }}>
      <main style={{ padding: "28px 40px 60px" }}>
        <div className="mb-8">
          <h1
            className="text-[22px] font-bold tracking-tight"
            style={{ color: "var(--stone-900)", letterSpacing: "-0.3px" }}
          >
            Import Opportunities
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--stone-500)" }}>
            Upload a CSV file to import opportunities into your organization.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-0 mb-8 pt-2" data-testid="progress-steps">
          <StepIndicator label="Upload" active={step === "upload"} done={step !== "upload"} num={1} />
          <StepDivider done={step !== "upload"} />
          <StepIndicator
            label="Map Columns"
            active={step === "mapping"}
            done={isEnrichmentStep || isDoneStep}
            num={2}
          />
          <StepDivider done={isEnrichmentStep || isDoneStep} />
          <StepIndicator
            label="Review Groups"
            active={step === "enrichment"}
            done={isDoneStep}
            num={3}
          />
          <StepDivider done={isDoneStep} />
          <StepIndicator
            label="Import"
            active={step === "importing" || step === "results"}
            done={step === "results"}
            num={4}
          />
        </div>

        {error && (
          <div
            className="mb-6 px-4 py-3 text-sm"
            style={{
              border: "1px solid #fca5a5",
              background: "var(--error-bg)",
              color: "var(--error)",
              borderRadius: "var(--radius-md, 10px)",
            }}
            data-testid="text-error"
          >
            {error}
          </div>
        )}

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div
            className="bg-white"
            style={{
              border: "1px solid var(--stone-200)",
              borderRadius: "var(--radius-lg, 14px)",
              overflow: "hidden",
            }}
            data-testid="section-upload"
          >
            <div className="p-6">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--stone-900)" }}>
                Select CSV file
              </h2>
              <p className="text-sm mb-4" style={{ color: "var(--stone-500)" }}>
                Your CSV must include columns for: name, amount, outcome, and at least one date
                (created_at, closed_date, or pipeline_accepted_date). Other columns are optional.
              </p>
              <p className="text-xs mb-4" style={{ color: "var(--stone-400)" }}>
                Values like &quot;NA&quot;, &quot;N/A&quot;, &quot;null&quot;, &quot;none&quot;, or
                empty cells are treated as missing data.
              </p>
              <label
                className="block cursor-pointer transition-colors mb-4"
                style={{
                  border: "2px dashed var(--stone-300)",
                  borderRadius: "var(--radius-lg, 14px)",
                  padding: "56px 40px",
                  textAlign: "center",
                  background: file ? "var(--teal-50)" : "var(--stone-50)",
                  borderColor: file ? "var(--teal-400)" : "var(--stone-300)",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  data-testid="input-file"
                />
                <div
                  className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: "var(--teal-100)" }}
                >
                  <svg
                    className="w-5 h-5"
                    style={{ color: "var(--teal-600)" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                {file ? (
                  <p className="text-[15px] font-semibold" style={{ color: "var(--stone-900)" }}>
                    {file.name}
                  </p>
                ) : (
                  <>
                    <p className="text-[15px] font-semibold mb-1" style={{ color: "var(--stone-900)" }}>
                      Drop your CSV here or{" "}
                      <span style={{ color: "var(--teal-600)" }}>browse</span>
                    </p>
                    <p className="text-[13px]" style={{ color: "var(--stone-500)" }}>
                      CSV files up to 10 MB
                    </p>
                  </>
                )}
              </label>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ background: "var(--teal-600)", borderRadius: "var(--radius-sm, 6px)" }}
                data-testid="button-upload"
              >
                {uploading ? "Parsing..." : "Upload & Preview"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === "mapping" && uploadResult && (
          <div className="space-y-6">
            <div
              className="bg-white"
              style={{
                border: "1px solid var(--stone-200)",
                borderRadius: "var(--radius-lg, 14px)",
                overflow: "hidden",
              }}
              data-testid="section-mapping"
            >
              <div className="p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                  <h2 className="text-sm font-semibold" style={{ color: "var(--stone-900)" }}>
                    Column Mapping
                  </h2>
                  <span
                    className="text-xs"
                    style={{ color: "var(--stone-500)" }}
                    data-testid="text-file-info"
                  >
                    {uploadResult.filename} — {uploadResult.totalRows} rows
                  </span>
                </div>
                <p className="text-sm mb-2" style={{ color: "var(--stone-500)" }}>
                  Map each CSV column to the corresponding opportunity field. Only Name, Amount, and
                  Outcome are required. At least one date field must also be mapped.
                </p>
                <p className="text-xs mb-4" style={{ color: "var(--stone-400)" }}>
                  Optional fields can be set to &quot;Not provided&quot; if your CSV doesn&apos;t
                  include them.
                </p>
                {getMappingWarnings().map((w, i) => (
                  <div
                    key={i}
                    className="mb-3 px-3 py-2 text-xs"
                    style={{
                      border: "1px solid #fcd34d",
                      background: "var(--warning-bg)",
                      color: "var(--warning)",
                      borderRadius: "var(--radius-sm, 6px)",
                    }}
                    data-testid={`mapping-warning-${i}`}
                  >
                    {w}
                  </div>
                ))}
                <div className="grid gap-3 sm:grid-cols-2">
                  {TARGET_FIELDS.map((field) => (
                    <div key={field.key} className="flex flex-col gap-1">
                      <label className="text-xs font-semibold" style={{ color: "var(--stone-700)" }}>
                        {field.label}
                        {field.required && (
                          <span style={{ color: "var(--error)" }} className="ml-0.5">
                            *
                          </span>
                        )}
                        {!field.required && (
                          <span className="font-normal ml-1" style={{ color: "var(--stone-400)" }}>
                            (optional)
                          </span>
                        )}
                      </label>
                      <select
                        value={mapping[field.key] || ""}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className="px-3 py-2 text-sm font-medium"
                        style={selectStyle}
                        data-testid={`select-mapping-${field.key}`}
                      >
                        <option value="">— Select column —</option>
                        {!field.required && <option value={NOT_PROVIDED}>Not provided</option>}
                        {uploadResult.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Import Mode */}
            <div
              className="bg-white"
              style={{
                border: "1px solid var(--stone-200)",
                borderRadius: "var(--radius-lg, 14px)",
                overflow: "hidden",
              }}
              data-testid="section-import-mode"
            >
              <div className="p-6">
                <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--stone-900)" }}>
                  Import Mode
                </h2>
                <div className="flex flex-col gap-3">
                  <label
                    className="flex items-start gap-3 cursor-pointer"
                    data-testid="radio-mode-append"
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === "append"}
                      onChange={() => setImportMode("append")}
                      className="mt-0.5"
                      style={{ accentColor: "var(--teal-600)" }}
                    />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--stone-900)" }}>
                        Append
                      </p>
                      <p className="text-xs" style={{ color: "var(--stone-500)" }}>
                        Add this data alongside your existing opportunities. Previous imports are
                        preserved.
                      </p>
                    </div>
                  </label>
                  <label
                    className="flex items-start gap-3 cursor-pointer"
                    data-testid="radio-mode-replace"
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === "replace"}
                      onChange={() => setImportMode("replace")}
                      className="mt-0.5"
                      style={{ accentColor: "var(--teal-600)" }}
                    />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--stone-900)" }}>
                        Replace
                      </p>
                      <p className="text-xs" style={{ color: "var(--stone-500)" }}>
                        Remove all existing opportunities and replace with this file.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div
              className="bg-white"
              style={{
                border: "1px solid var(--stone-200)",
                borderRadius: "var(--radius-lg, 14px)",
                overflow: "hidden",
              }}
              data-testid="section-preview"
            >
              <div className="p-6">
                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--stone-900)" }}>
                  Preview (first {Math.min(20, uploadResult.preview.length)} rows)
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-[13px]">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--stone-200)" }}>
                        <th
                          className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase"
                          style={{
                            color: "var(--stone-500)",
                            letterSpacing: "0.5px",
                            background: "var(--stone-50)",
                          }}
                        >
                          #
                        </th>
                        {uploadResult.headers.map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase whitespace-nowrap"
                            style={{
                              color: "var(--stone-500)",
                              letterSpacing: "0.5px",
                              background: "var(--stone-50)",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.preview.map((row, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--stone-100)" }}>
                          <td className="px-3 py-2.5 text-xs" style={{ color: "var(--stone-400)" }}>
                            {i + 1}
                          </td>
                          {uploadResult.headers.map((h) => (
                            <td
                              key={h}
                              className="px-3 py-2.5 text-xs whitespace-nowrap max-w-[200px] truncate"
                              style={{ color: "var(--stone-700)" }}
                            >
                              {row[h] || ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleReset}
                className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold transition-colors"
                style={{
                  background: "#fff",
                  color: "var(--stone-700)",
                  border: "1px solid var(--stone-200)",
                  borderRadius: "var(--radius-sm, 6px)",
                }}
                data-testid="button-back-upload"
              >
                Back
              </button>
              <button
                onClick={handleProceedToEnrichment}
                disabled={!isMappingValid()}
                className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ background: "var(--teal-600)", borderRadius: "var(--radius-sm, 6px)" }}
                data-testid="button-proceed-enrichment"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Enrichment Review */}
        {step === "enrichment" && (
          <div className="space-y-6" data-testid="section-enrichment">
            <div
              className="bg-white"
              style={{
                border: "1px solid var(--stone-200)",
                borderRadius: "var(--radius-lg, 14px)",
                overflow: "hidden",
              }}
            >
              <div className="p-6">
                <div className="flex items-start gap-3 mb-2">
                  <div
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md shrink-0"
                    style={{ background: "var(--teal-50)" }}
                  >
                    <svg
                      className="w-4 h-4"
                      style={{ color: "var(--teal-600)" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color: "var(--stone-900)" }}>
                      Review AI-Inferred Groups
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--stone-500)" }}>
                      We&apos;ve classified your industry and source values into standard groups.
                      Review and adjust before importing — these groupings will appear as additional
                      dimensions in your analytics.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {enrichmentLoading && (
              <div
                className="bg-white p-8 text-center"
                style={{
                  border: "1px solid var(--stone-200)",
                  borderRadius: "var(--radius-lg, 14px)",
                }}
              >
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-3"
                  style={{ background: "var(--teal-50)" }}
                >
                  <svg
                    className="w-5 h-5 animate-spin"
                    style={{ color: "var(--teal-600)" }}
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--stone-900)" }}>
                  Classifying your data...
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--stone-500)" }}>
                  This takes a few seconds.
                </p>
              </div>
            )}

            {enrichmentError && (
              <div
                className="px-4 py-3 text-sm"
                style={{
                  border: "1px solid #fca5a5",
                  background: "var(--error-bg)",
                  color: "var(--error)",
                  borderRadius: "var(--radius-md, 10px)",
                }}
              >
                {enrichmentError}
              </div>
            )}

            {!enrichmentLoading && (
              <>
                {/* Industry Cluster Mapping */}
                {Object.keys(enrichmentMapping.industry).length > 0 && (
                  <div
                    className="bg-white"
                    style={{
                      border: "1px solid var(--stone-200)",
                      borderRadius: "var(--radius-lg, 14px)",
                      overflow: "hidden",
                    }}
                    data-testid="section-industry-enrichment"
                  >
                    <div
                      className="px-6 py-4"
                      style={{ borderBottom: "1px solid var(--stone-100)" }}
                    >
                      <h3 className="text-sm font-semibold" style={{ color: "var(--stone-900)" }}>
                        Industry → Cluster
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: "var(--stone-500)" }}>
                        NACE-based groupings. Used for cross-segment analysis.
                      </p>
                    </div>
                    <div className="divide-y" style={{ borderColor: "var(--stone-100)" }}>
                      {Object.entries(enrichmentMapping.industry).map(([raw, cluster]) => (
                        <div
                          key={raw}
                          className="flex items-center gap-4 px-6 py-3"
                          data-testid={`industry-row-${raw}`}
                        >
                          <span
                            className="text-sm font-medium w-48 shrink-0 truncate"
                            style={{ color: "var(--stone-900)" }}
                            title={raw}
                          >
                            {raw}
                          </span>
                          <svg
                            className="w-4 h-4 shrink-0"
                            style={{ color: "var(--stone-400)" }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                          <select
                            value={cluster}
                            onChange={(e) => updateIndustryCluster(raw, e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm"
                            style={selectStyle}
                            data-testid={`select-industry-cluster-${raw}`}
                          >
                            {INDUSTRY_CLUSTERS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source Group Mapping */}
                {Object.keys(enrichmentMapping.source).length > 0 && (
                  <div
                    className="bg-white"
                    style={{
                      border: "1px solid var(--stone-200)",
                      borderRadius: "var(--radius-lg, 14px)",
                      overflow: "hidden",
                    }}
                    data-testid="section-source-enrichment"
                  >
                    <div
                      className="px-6 py-4"
                      style={{ borderBottom: "1px solid var(--stone-100)" }}
                    >
                      <h3 className="text-sm font-semibold" style={{ color: "var(--stone-900)" }}>
                        Source → Group
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: "var(--stone-500)" }}>
                        Inbound vs outbound classification for motion analysis.
                      </p>
                    </div>
                    <div className="divide-y" style={{ borderColor: "var(--stone-100)" }}>
                      {Object.entries(enrichmentMapping.source).map(([raw, group]) => (
                        <div
                          key={raw}
                          className="flex items-center gap-4 px-6 py-3"
                          data-testid={`source-row-${raw}`}
                        >
                          <span
                            className="text-sm font-medium w-48 shrink-0 truncate"
                            style={{ color: "var(--stone-900)" }}
                            title={raw}
                          >
                            {raw}
                          </span>
                          <svg
                            className="w-4 h-4 shrink-0"
                            style={{ color: "var(--stone-400)" }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                          <select
                            value={group}
                            onChange={(e) => updateSourceGroup(raw, e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm"
                            style={selectStyle}
                            data-testid={`select-source-group-${raw}`}
                          >
                            {Object.entries(SOURCE_GROUP_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(enrichmentMapping.industry).length === 0 &&
                  Object.keys(enrichmentMapping.source).length === 0 &&
                  !enrichmentError && (
                    <div
                      className="bg-white p-6 text-center"
                      style={{
                        border: "1px solid var(--stone-200)",
                        borderRadius: "var(--radius-lg, 14px)",
                      }}
                    >
                      <p className="text-sm" style={{ color: "var(--stone-500)" }}>
                        No industry or source data found in the preview rows. Groups will be inferred
                        from the full dataset during import.
                      </p>
                    </div>
                  )}
              </>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setStep("mapping")}
                className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold transition-colors"
                style={{
                  background: "#fff",
                  color: "var(--stone-700)",
                  border: "1px solid var(--stone-200)",
                  borderRadius: "var(--radius-sm, 6px)",
                }}
                data-testid="button-back-mapping"
              >
                Back
              </button>
              <button
                onClick={handleImportClick}
                disabled={enrichmentLoading}
                className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{
                  background: importMode === "replace" ? "var(--error)" : "var(--teal-600)",
                  borderRadius: "var(--radius-sm, 6px)",
                }}
                data-testid="button-import"
              >
                {importMode === "replace" ? "Replace & Import" : "Import"} {uploadResult?.totalRows}{" "}
                Rows
              </button>
            </div>
          </div>
        )}

        {/* Replace Confirmation Modal */}
        {showReplaceConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            data-testid="modal-replace-confirm"
          >
            <div
              className="bg-white p-6 shadow-xl max-w-md mx-4"
              style={{
                border: "1px solid var(--stone-200)",
                borderRadius: "var(--radius-lg, 14px)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full"
                  style={{ background: "var(--error-bg)" }}
                >
                  <svg
                    className="w-5 h-5"
                    style={{ color: "var(--error)" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold" style={{ color: "var(--stone-900)" }}>
                  Replace Existing Data?
                </h3>
              </div>
              <p className="text-sm mb-6" style={{ color: "var(--stone-500)" }}>
                This will remove all existing opportunities and replace them with the data from this
                file. This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowReplaceConfirm(false)}
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold"
                  style={{
                    background: "#fff",
                    color: "var(--stone-700)",
                    border: "1px solid var(--stone-200)",
                    borderRadius: "var(--radius-sm, 6px)",
                  }}
                  data-testid="button-cancel-replace"
                >
                  Cancel
                </button>
                <button
                  onClick={doImport}
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: "var(--error)", borderRadius: "var(--radius-sm, 6px)" }}
                  data-testid="button-confirm-replace"
                >
                  Yes, Replace All Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === "importing" && (
          <div
            className="bg-white p-6 text-center"
            style={{
              border: "1px solid var(--stone-200)",
              borderRadius: "var(--radius-lg, 14px)",
            }}
            data-testid="section-importing"
          >
            <div
              className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-4"
              style={{ background: "var(--teal-50)" }}
            >
              <svg
                className="w-5 h-5 animate-spin"
                style={{ color: "var(--teal-600)" }}
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--stone-900)" }}>
              Importing opportunities...
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--stone-500)" }}>
              This may take a moment.
            </p>
          </div>
        )}

        {/* Step: Results */}
        {step === "results" && importResult && (
          <div className="space-y-6">
            <div
              className="bg-white"
              style={{
                border: "1px solid var(--stone-200)",
                borderRadius: "var(--radius-lg, 14px)",
                overflow: "hidden",
              }}
              data-testid="section-results"
            >
              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--success)"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <h2 className="text-[15px] font-bold" style={{ color: "var(--stone-900)" }}>
                    Import Complete
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div
                    className="bg-white p-5"
                    style={{
                      border: "1px solid var(--stone-200)",
                      borderRadius: "var(--radius-md, 10px)",
                    }}
                  >
                    <p
                      className="text-xs font-semibold uppercase mb-1"
                      style={{ color: "var(--stone-500)", letterSpacing: "0.4px" }}
                    >
                      Total Rows
                    </p>
                    <p
                      className="text-[28px] font-bold"
                      style={{ color: "var(--stone-900)", letterSpacing: "-0.5px" }}
                      data-testid="text-total-rows"
                    >
                      {importResult.totalRows}
                    </p>
                  </div>
                  <div
                    className="bg-white p-5"
                    style={{
                      border: "1px solid var(--stone-200)",
                      borderLeft: "3px solid var(--success)",
                      borderRadius: "var(--radius-md, 10px)",
                    }}
                  >
                    <p
                      className="text-xs font-semibold uppercase mb-1"
                      style={{ color: "var(--stone-500)", letterSpacing: "0.4px" }}
                    >
                      Inserted
                    </p>
                    <p
                      className="text-[28px] font-bold"
                      style={{ color: "var(--success)", letterSpacing: "-0.5px" }}
                      data-testid="text-inserted-count"
                    >
                      {importResult.insertedCount}
                    </p>
                  </div>
                  <div
                    className="bg-white p-5"
                    style={{
                      border: "1px solid var(--stone-200)",
                      borderLeft:
                        importResult.errorCount > 0 ? "3px solid var(--error)" : undefined,
                      borderRadius: "var(--radius-md, 10px)",
                    }}
                  >
                    <p
                      className="text-xs font-semibold uppercase mb-1"
                      style={{ color: "var(--stone-500)", letterSpacing: "0.4px" }}
                    >
                      Errors
                    </p>
                    <p
                      className="text-[28px] font-bold"
                      style={{
                        color:
                          importResult.errorCount > 0 ? "var(--error)" : "var(--stone-900)",
                        letterSpacing: "-0.5px",
                      }}
                      data-testid="text-error-count"
                    >
                      {importResult.errorCount}
                    </p>
                  </div>
                </div>

                {/* Enrichment summary */}
                {importResult.enrichmentMapping &&
                  (Object.keys(importResult.enrichmentMapping.industry).length > 0 ||
                    Object.keys(importResult.enrichmentMapping.source).length > 0) && (
                    <div
                      className="mt-5 px-4 py-3 rounded-md"
                      style={{
                        background: "var(--teal-50)",
                        border: "1px solid var(--teal-200)",
                      }}
                    >
                      <p className="text-xs font-semibold" style={{ color: "var(--teal-800)" }}>
                        Enrichment applied
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--teal-700)" }}>
                        {Object.keys(importResult.enrichmentMapping.industry).length > 0 &&
                          `${Object.keys(importResult.enrichmentMapping.industry).length} industry values → clusters. `}
                        {Object.keys(importResult.enrichmentMapping.source).length > 0 &&
                          `${Object.keys(importResult.enrichmentMapping.source).length} source values → inbound/outbound.`}
                        {" "}These appear as &ldquo;Industry Cluster&rdquo; and &ldquo;Source Group&rdquo; in your analytics.
                      </p>
                    </div>
                  )}
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div
                className="bg-white"
                style={{
                  border: "1px solid var(--stone-200)",
                  borderRadius: "var(--radius-lg, 14px)",
                  overflow: "hidden",
                }}
                data-testid="section-error-details"
              >
                <div className="p-6">
                  <h2
                    className="text-sm font-semibold mb-4 flex items-center gap-2"
                    style={{ color: "var(--stone-800)" }}
                  >
                    Error Details
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--error-bg)", color: "var(--error)" }}
                    >
                      {importResult.errorCount} rows
                    </span>
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-[13px]">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--stone-200)" }}>
                          <th
                            className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase"
                            style={{
                              color: "var(--stone-500)",
                              background: "var(--stone-50)",
                              letterSpacing: "0.5px",
                              width: "60px",
                            }}
                          >
                            Row
                          </th>
                          <th
                            className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase"
                            style={{
                              color: "var(--stone-500)",
                              background: "var(--stone-50)",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Error
                          </th>
                          <th
                            className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase"
                            style={{
                              color: "var(--stone-500)",
                              background: "var(--stone-50)",
                              letterSpacing: "0.5px",
                              width: "240px",
                            }}
                          >
                            Data
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.errors.map((err, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--stone-100)" }}>
                            <td className="px-4 py-3" data-testid={`text-error-row-${i}`}>
                              <span
                                className="font-mono text-xs px-2 py-0.5 rounded"
                                style={{
                                  background: "var(--stone-100)",
                                  color: "var(--stone-400)",
                                }}
                              >
                                {err.row_number}
                              </span>
                            </td>
                            <td className="px-4 py-3" data-testid={`text-error-msg-${i}`}>
                              <span
                                className="text-xs px-2 py-1 rounded inline-block"
                                style={{ background: "var(--error-bg)", color: "var(--error)" }}
                              >
                                {err.error_message}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="font-mono text-[11px] max-w-[280px] truncate block"
                                style={{ color: "var(--stone-500)" }}
                              >
                                {JSON.stringify(err.raw_row_json)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleReset}
                className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold"
                style={{
                  background: "#fff",
                  color: "var(--stone-700)",
                  border: "1px solid var(--stone-200)",
                  borderRadius: "var(--radius-sm, 6px)",
                }}
                data-testid="button-import-another"
              >
                Import Another File
              </button>
              <Link
                href={`/app/dashboard${importResult.jobId ? `?dataset=${importResult.jobId}` : ""}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white"
                style={{ background: "var(--teal-600)", borderRadius: "var(--radius-sm, 6px)" }}
                data-testid="link-view-analytics"
              >
                View Analytics
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Import History */}
        <div className="mt-12" data-testid="section-import-history">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--stone-900)" }}>
            Import History
          </h2>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg
                className="w-5 h-5 animate-spin"
                style={{ color: "var(--teal-600)" }}
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          ) : importHistory.length === 0 ? (
            <div
              className="bg-white p-6 text-center"
              style={{
                border: "1px solid var(--stone-200)",
                borderRadius: "var(--radius-lg, 14px)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--stone-500)" }}>
                No imports yet. Upload a CSV file above to get started.
              </p>
            </div>
          ) : (
            <div
              className="bg-white overflow-hidden"
              style={{
                border: "1px solid var(--stone-200)",
                borderRadius: "var(--radius-lg, 14px)",
              }}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-[13px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--stone-200)" }}>
                      {["File", "Mode", "Status", "Rows", "Inserted", "Errors", "Date", "Actions"].map(
                        (h) => (
                          <th
                            key={h}
                            className={`px-4 py-3 text-[11px] font-semibold uppercase ${
                              ["Rows", "Inserted", "Errors"].includes(h) ? "text-right" : "text-left"
                            }`}
                            style={{
                              color: "var(--stone-500)",
                              background: "var(--stone-50)",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {importHistory.map((job) => (
                      <tr
                        key={job.id}
                        style={{
                          borderBottom: "1px solid var(--stone-100)",
                          opacity: !job.is_active ? 0.5 : 1,
                        }}
                        data-testid={`import-job-${job.id}`}
                      >
                        <td
                          className="px-4 py-3 font-medium whitespace-nowrap max-w-[200px] truncate"
                          style={{ color: "var(--stone-900)" }}
                        >
                          {job.filename}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              background:
                                job.import_mode === "replace"
                                  ? "var(--warning-bg)"
                                  : "var(--info-bg)",
                              color:
                                job.import_mode === "replace"
                                  ? "var(--warning)"
                                  : "var(--teal-700)",
                            }}
                          >
                            {job.import_mode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={job.status} isActive={job.is_active} />
                        </td>
                        <td className="px-4 py-3 text-right" style={{ color: "var(--stone-700)" }}>
                          {job.row_count}
                        </td>
                        <td className="px-4 py-3 text-right" style={{ color: "var(--success)" }}>
                          {job.inserted_count}
                        </td>
                        <td
                          className="px-4 py-3 text-right"
                          style={{
                            color: job.error_count > 0 ? "var(--error)" : "var(--stone-700)",
                          }}
                        >
                          {job.error_count}
                        </td>
                        <td
                          className="px-4 py-3 whitespace-nowrap"
                          style={{ color: "var(--stone-500)" }}
                        >
                          {new Date(job.created_at).toLocaleDateString()}{" "}
                          {new Date(job.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          {job.status === "completed" && job.is_active && (
                            <Link
                              href={`/app/dashboard?dataset=${job.id}`}
                              className="text-xs font-medium"
                              style={{ color: "var(--teal-600)" }}
                              data-testid={`link-analytics-${job.id}`}
                            >
                              View Analytics
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status, isActive }: { status: string; isActive: boolean }) {
  if (!isActive) {
    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{ background: "var(--stone-100)", color: "var(--stone-500)" }}
      >
        inactive
      </span>
    );
  }
  const styles: Record<string, { bg: string; color: string }> = {
    completed: { bg: "var(--success-bg)", color: "var(--success)" },
    running: { bg: "var(--info-bg)", color: "var(--teal-700)" },
    pending: { bg: "var(--warning-bg)", color: "var(--warning)" },
    failed: { bg: "var(--error-bg)", color: "var(--error)" },
  };
  const s = styles[status] || styles.pending;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

function StepIndicator({
  label,
  active,
  done,
  num,
}: {
  label: string;
  active: boolean;
  done: boolean;
  num: number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold"
        style={{
          background: done && !active ? "var(--teal-600)" : active ? "var(--teal-50)" : "#fff",
          color:
            done && !active ? "#fff" : active ? "var(--teal-600)" : "var(--stone-400)",
          border:
            done && !active
              ? "2px solid var(--teal-600)"
              : active
              ? "2px solid var(--teal-600)"
              : "2px solid var(--stone-300)",
        }}
      >
        {done && !active ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          num
        )}
      </span>
      <span
        className="text-[13px] font-medium"
        style={{ color: active || done ? "var(--stone-700)" : "var(--stone-400)" }}
      >
        {label}
      </span>
    </div>
  );
}

function StepDivider({ done }: { done?: boolean }) {
  return (
    <div
      style={{
        width: "40px",
        height: "2px",
        background: done ? "var(--teal-400)" : "var(--stone-200)",
        margin: "0 10px",
      }}
    />
  );
}