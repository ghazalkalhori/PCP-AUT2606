// GenerateReport — simple test UI for the Ollama LLM connection.
// Phase 1 testing page: not the final polished UI.

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Wifi, WifiOff } from "lucide-react";
import { testOllamaConnection, generateReport } from "../services/reportService.js";

const CACHE_BASE = "/samples/dribl-cache";

export default function GenerateReport() {
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState(null);

  const [reportType, setReportType] = useState("post_match");
  const [tone, setTone] = useState("professional");
  const [excitement, setExcitement] = useState("medium");
  const [comedicEffect, setComedicEffect] = useState("none");
  const [model, setModel] = useState("qwen2.5:14b");
  const [jsonInput, setJsonInput] = useState("{\n  \"loading\": \"Loading cached data…\"\n}");

  const [cacheFiles, setCacheFiles] = useState([]);
  const [selectedCacheFile, setSelectedCacheFile] = useState("");

  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState("");
  const [usedModel, setUsedModel] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadCacheIndex();
  }, []);

  async function loadCacheIndex() {
    try {
      const response = await fetch(`${CACHE_BASE}/index.json`);
      const index = await response.json();
      const files = index.files || [];
      setCacheFiles(files);

      const defaultFile =
        files.find((f) => f.file?.includes("report-ready"))?.file ||
        files[0]?.file;

      if (defaultFile) {
        setSelectedCacheFile(defaultFile);
        await loadCachedFile(defaultFile);
      }
    } catch {
      setError("Could not load offline Dribl cache. Run backend/scripts/download_dribl_cache.py.");
    }
  }

  async function loadCachedFile(filename) {
    if (!filename) return;
    setError("");
    try {
      const response = await fetch(`${CACHE_BASE}/${filename}`);
      const data = await response.json();
      setJsonInput(JSON.stringify(data, null, 2));

      const meta = cacheFiles.find((f) => f.file === filename);
      if (meta?.reportUseCase) {
        setReportType(meta.reportUseCase);
      } else if (data.reportType) {
        setReportType(data.reportType);
      } else if (filename.includes("leagues") || filename.includes("fixtures-list")) {
        setReportType("round_summary");
      } else if (filename.includes("pre")) {
        setReportType("pre_match");
      }
    } catch {
      setError(`Could not load ${filename}`);
    }
  }

  async function handleTestConnection() {
    setStatusLoading(true);
    setStatusResult(null);
    try {
      const result = await testOllamaConnection();
      setStatusResult(result);
    } catch {
      setStatusResult({ success: false, error: "Could not reach backend server." });
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleGenerate(event) {
    event.preventDefault();
    setError("");
    setGeneratedReport("");

    // Parse JSON input
    let matchData;
    try {
      matchData = JSON.parse(jsonInput);
    } catch {
      setError("Invalid JSON. Please check the sample data or fix the formatting.");
      return;
    }

    setGenerating(true);
    try {
      const result = await generateReport({
        report_type: reportType,
        tone,
        excitement,
        comedic_effect: comedicEffect,
        match_data: matchData,
        model: model.trim() || undefined,
      });

      if (result.success) {
        setGeneratedReport(result.report || "");
        setUsedModel(result.model || model);
      } else {
        setError(result.error || result.detail || "Generation failed. Check Ollama connection.");
      }
    } catch {
      setError("Could not reach the backend server.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-full bg-[#f5f6fa] px-4 pb-10 pt-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Generate Report</h1>
        <p className="mt-1 text-sm text-gray-400">
          Test the Ollama LLM connection and generate a football report draft.
        </p>
      </div>

      {/* ── Ollama connection tester ── */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Ollama Connection</h2>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={statusLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {statusLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Wifi size={14} />
            )}
            {statusLoading ? "Testing…" : "Test Ollama Connection"}
          </button>
        </div>

        {statusResult && (
          <div
            className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
              statusResult.success
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {statusResult.success ? (
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
            ) : (
              <WifiOff size={15} className="mt-0.5 shrink-0 text-red-500" />
            )}
            <div>
              {statusResult.success ? (
                <>
                  <p className="font-medium">Connected to Ollama</p>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    URL: {statusResult.ollamaUrl}
                  </p>
                  {statusResult.models?.length > 0 && (
                    <p className="mt-0.5 text-xs text-emerald-700">
                      Models: {statusResult.models.join(", ")}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-medium">Connection failed</p>
                  <p className="mt-0.5 text-xs">{statusResult.error}</p>
                  <p className="mt-1 text-xs text-red-600">
                    Check: VPN is on → SSH tunnel is open → Ollama is running on the server →
                    OLLAMA_URL in backend .env is correct → restart backend after .env changes.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Generation form ── */}
      <form onSubmit={handleGenerate} className="space-y-5">
        <div className="grid gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:grid-cols-2">
          <h2 className="col-span-full text-sm font-semibold text-gray-700">
            Report Settings
          </h2>

          {/* Report type */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500">Report Type</span>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none"
            >
              <option value="post_match">Post Match</option>
              <option value="pre_match">Pre Match</option>
              <option value="round_summary">Round Summary</option>
            </select>
          </label>

          {/* Tone */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500">Tone</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none"
            >
              <option value="professional">Professional</option>
              <option value="fan_based">Fan Based</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
            </select>
          </label>

          {/* Excitement */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500">Excitement Level</span>
            <select
              value={excitement}
              onChange={(e) => setExcitement(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          {/* Comedic effect */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500">Comedic Effect</span>
            <select
              value={comedicEffect}
              onChange={(e) => setComedicEffect(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none"
            >
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
            </select>
          </label>

          {/* Model */}
          <label className="col-span-full flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500">
              Model <span className="text-gray-400">(leave blank to use server default)</span>
            </span>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="qwen2.5:14b"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none"
            />
          </label>
        </div>

        {/* Offline Dribl cache picker */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-gray-700">Offline data file</span>
            <span className="text-xs text-gray-400">
              Labels: [FINISHED] = post-match · [NOT FINISHED] = pre-match · [ROUND SUMMARY] =
              many matches/leagues. Cached from Dribl (FWW).
            </span>
            <select
              value={selectedCacheFile}
              onChange={(e) => {
                const file = e.target.value;
                setSelectedCacheFile(file);
                loadCachedFile(file);
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none"
            >
              {cacheFiles.length === 0 && (
                <option value="">No cache files — run download script</option>
              )}
              {cacheFiles.map((entry) => (
                <option key={entry.file} value={entry.file}>
                  {entry.description || entry.file}
                </option>
              ))}
            </select>
            {selectedCacheFile && (
              <p className="text-xs text-slate-500">
                {(() => {
                  const meta = cacheFiles.find((f) => f.file === selectedCacheFile);
                  if (!meta) return null;
                  const parts = [
                    meta.matchStatus && `Match: ${meta.matchStatus}`,
                    meta.reportUseCase && `Report: ${meta.reportUseCase}`,
                    meta.eventStatus && `API status: ${meta.eventStatus}`,
                  ].filter(Boolean);
                  return parts.join(" · ");
                })()}
              </p>
            )}
          </label>
        </div>

        {/* JSON input */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-gray-700">Match Data (JSON)</span>
            <span className="text-xs text-gray-400">
              Edit this JSON. The model will only use what is provided here.
            </span>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={18}
              spellCheck={false}
              className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800 focus:border-emerald-400 focus:outline-none"
            />
          </label>
        </div>

        {/* Error display */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={generating}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {generating ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Generating… (may take up to 5 minutes while model loads)
            </>
          ) : (
            "Generate Report"
          )}
        </button>
      </form>

      {/* Generated report output */}
      {generatedReport && (
        <div className="mt-6 rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Generated Report Draft</h2>
            <span className="text-xs text-gray-400">Model: {usedModel}</span>
          </div>
          <div className="space-y-3 text-sm leading-7 text-gray-800">
            {generatedReport.split("\n").map((line, i) =>
              line.trim() ? <p key={i}>{line}</p> : <br key={i} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
