"use client";

import { useState, useRef } from "react";
import Link from "next/link";

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
  totalRows: number;
  errors: {
    row_number: number;
    error_message: string;
    raw_row_json: Record<string, string>;
  }[];
};

const TARGET_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "role", label: "Role", required: true },
  { key: "industry", label: "Industry", required: true },
  { key: "source", label: "Source", required: true },
  { key: "amount", label: "Amount", required: true },
  { key: "outcome", label: "Outcome", required: true },
  { key: "created_at", label: "Created At", required: false },
  { key: "closed_date", label: "Closed Date", required: false },
  { key: "pipeline_accepted_date", label: "Pipeline Accepted Date", required: false },
  { key: "segment", label: "Segment", required: false },
  { key: "country", label: "Country", required: false },
];

type Step = "upload" | "mapping" | "importing" | "results";

export default function ImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) return;
    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import/upload", {
        method: "POST",
        body: formData,
      });

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
        if (match) {
          autoMapping[field.key] = match;
        }
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
    setMapping((prev) => ({
      ...prev,
      [targetField]: csvHeader,
    }));
  }

  function isMappingValid(): boolean {
    return TARGET_FIELDS.filter((f) => f.required).every(
      (f) => mapping[f.key] && mapping[f.key] !== ""
    );
  }

  async function handleImport() {
    if (!file || !uploadResult) return;
    setError("");
    setImporting(true);
    setStep("importing");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mapping", JSON.stringify(mapping));

      const res = await fetch("/api/import/execute", {
        method: "POST",
        body: formData,
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary">
              <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground" data-testid="text-import-title">
              Import Opportunities
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/app/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-analytics"
            >
              Analytics
            </Link>
            <Link
              href="/app"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-back-dashboard"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            CSV Import
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a CSV file to import opportunities into your organization.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8 text-sm" data-testid="progress-steps">
          <StepIndicator label="Upload" active={step === "upload"} done={step !== "upload"} num={1} />
          <StepDivider />
          <StepIndicator label="Map Columns" active={step === "mapping"} done={step === "importing" || step === "results"} num={2} />
          <StepDivider />
          <StepIndicator label="Import" active={step === "importing" || step === "results"} done={step === "results"} num={3} />
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400" data-testid="text-error">
            {error}
          </div>
        )}

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="rounded-md border border-border bg-card p-6" data-testid="section-upload">
            <h2 className="text-sm font-medium text-foreground mb-4">Select CSV file</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Your CSV should include columns for: name, role, industry, source, amount, outcome. Optionally include created_at.
            </p>
            <div className="space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground file:cursor-pointer cursor-pointer"
                  data-testid="input-file"
                />
              </div>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="rounded-md border border-border bg-card p-6" data-testid="section-mapping">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <h2 className="text-sm font-medium text-foreground">
                  Column Mapping
                </h2>
                <span className="text-xs text-muted-foreground" data-testid="text-file-info">
                  {uploadResult.filename} — {uploadResult.totalRows} rows
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Map each CSV column to the corresponding opportunity field.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {TARGET_FIELDS.map((field) => (
                  <div key={field.key} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-foreground">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <select
                      value={mapping[field.key] || ""}
                      onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                      data-testid={`select-mapping-${field.key}`}
                    >
                      <option value="">— Select column —</option>
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

            {/* Preview */}
            <div className="rounded-md border border-border bg-card p-6" data-testid="section-preview">
              <h2 className="text-sm font-medium text-foreground mb-4">
                Preview (first {Math.min(20, uploadResult.preview.length)} rows)
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                      {uploadResult.headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResult.preview.map((row, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="px-3 py-2 text-xs text-muted-foreground">{i + 1}</td>
                        {uploadResult.headers.map((h) => (
                          <td key={h} className="px-3 py-2 text-xs text-foreground whitespace-nowrap max-w-[200px] truncate">
                            {row[h] || ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleReset}
                className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
                data-testid="button-back-upload"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={!isMappingValid()}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-import"
              >
                Import {uploadResult.totalRows} Rows
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === "importing" && (
          <div className="rounded-md border border-border bg-card p-6 text-center" data-testid="section-importing">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-4">
              <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-sm text-foreground font-medium">Importing opportunities...</p>
            <p className="text-xs text-muted-foreground mt-1">This may take a moment.</p>
          </div>
        )}

        {/* Step 4: Results */}
        {step === "results" && importResult && (
          <div className="space-y-6">
            <div className="rounded-md border border-border bg-card p-6" data-testid="section-results">
              <h2 className="text-sm font-medium text-foreground mb-4">Import Complete</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-md border border-border p-4">
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                  <p className="text-2xl font-semibold text-foreground mt-1" data-testid="text-total-rows">
                    {importResult.totalRows}
                  </p>
                </div>
                <div className="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-4">
                  <p className="text-xs text-green-700 dark:text-green-400">Inserted</p>
                  <p className="text-2xl font-semibold text-green-700 dark:text-green-400 mt-1" data-testid="text-inserted-count">
                    {importResult.insertedCount}
                  </p>
                </div>
                <div className={`rounded-md border p-4 ${importResult.errorCount > 0 ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20" : "border-border"}`}>
                  <p className={`text-xs ${importResult.errorCount > 0 ? "text-red-700 dark:text-red-400" : "text-muted-foreground"}`}>Errors</p>
                  <p className={`text-2xl font-semibold mt-1 ${importResult.errorCount > 0 ? "text-red-700 dark:text-red-400" : "text-foreground"}`} data-testid="text-error-count">
                    {importResult.errorCount}
                  </p>
                </div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="rounded-md border border-border bg-card p-6" data-testid="section-error-details">
                <h2 className="text-sm font-medium text-foreground mb-4">
                  Error Details {importResult.errors.length < importResult.errorCount && `(showing first ${importResult.errors.length})`}
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Row</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Error</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.errors.map((err, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="px-3 py-2 text-xs text-foreground" data-testid={`text-error-row-${i}`}>
                            {err.row_number}
                          </td>
                          <td className="px-3 py-2 text-xs text-red-600 dark:text-red-400" data-testid={`text-error-msg-${i}`}>
                            {err.error_message}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground font-mono max-w-[300px] truncate">
                            {JSON.stringify(err.raw_row_json)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleReset}
                className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
                data-testid="button-import-another"
              >
                Import Another File
              </button>
              <Link
                href="/app"
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                data-testid="link-back-dashboard-results"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StepIndicator({ label, active, done, num }: { label: string; active: boolean; done: boolean; num: number }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
          done && !active
            ? "bg-primary text-primary-foreground"
            : active
            ? "bg-primary/20 text-primary border border-primary"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {done && !active ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          num
        )}
      </span>
      <span className={`text-xs ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}

function StepDivider() {
  return <div className="flex-1 h-px bg-border max-w-[60px]" />;
}
