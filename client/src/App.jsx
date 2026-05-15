import { useState } from 'react';
import { testOllamaConnection, generateReport } from './api.js';
import { POST_MATCH_SAMPLE, SAMPLE_OPTIONS } from './sampleData.js';

const INVALID_JSON_MESSAGE =
  'Invalid JSON. Please check the sample data or fix the formatting.';

export default function App() {
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);

  const [model, setModel] = useState('qwen2.5:14b');
  const [reportType, setReportType] = useState('post_match');
  const [tone, setTone] = useState('professional');
  const [excitement, setExcitement] = useState('medium');
  const [comedicEffect, setComedicEffect] = useState('none');
  const [sampleSelection, setSampleSelection] = useState('');
  const [matchJson, setMatchJson] = useState(POST_MATCH_SAMPLE);

  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState('');
  const [generateError, setGenerateError] = useState('');

  function handleLoadSample(e) {
    const selectedId = e.target.value;
    setSampleSelection(selectedId);

    const sample = SAMPLE_OPTIONS.find((option) => option.id === selectedId);
    if (!sample?.json) return;

    setMatchJson(sample.json);

    try {
      const parsed = JSON.parse(sample.json);
      if (parsed.reportType) {
        setReportType(parsed.reportType);
      }
    } catch {
      // Sample data is fixed; ignore parse errors here.
    }
  }

  async function handleTestConnection() {
    setStatusLoading(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      const data = await testOllamaConnection();

      if (data.success) {
        const modelList =
          data.models?.length > 0
            ? data.models.join('\n  - ')
            : '(no models listed)';
        setStatusMessage(
          `Ollama is reachable at ${data.ollamaUrl}\n\nAvailable models:\n  - ${modelList}`,
        );
      } else {
        setStatusError(true);
        setStatusMessage(
          data.error || 'Could not reach Ollama. Check VPN and SSH tunnel.',
        );
      }
    } catch (err) {
      setStatusError(true);
      setStatusMessage(
        err.message ||
          'Failed to call backend. Is the server running on http://localhost:3001?',
      );
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleGenerateReport(e) {
    e.preventDefault();
    setGenerating(true);
    setReport('');
    setGenerateError('');

    let matchData;
    try {
      matchData = JSON.parse(matchJson);
    } catch {
      setGenerateError(INVALID_JSON_MESSAGE);
      setGenerating(false);
      return;
    }

    try {
      const data = await generateReport({
        model,
        reportType,
        tone,
        excitement,
        comedicEffect,
        matchData,
      });

      if (data.success && data.report) {
        setReport(data.report);
      } else {
        setGenerateError(data.error || 'Report generation failed.');
      }
    } catch (err) {
      setGenerateError(err.message || 'Report generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <h1>Reporta AI - LLM Connection Test</h1>

      <section>
        <h2>Connection Status</h2>
        <button
          type="button"
          className="secondary"
          onClick={handleTestConnection}
          disabled={statusLoading}
        >
          {statusLoading ? 'Testing…' : 'Test Ollama Connection'}
        </button>
        {statusMessage && (
          <div className={`status-box ${statusError ? 'error' : ''}`}>
            {statusMessage}
          </div>
        )}
      </section>

      <section>
        <h2>Generate Football Report</h2>
        <form onSubmit={handleGenerateReport}>
          <label>
            <span>Model</span>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="qwen2.5:14b"
            />
          </label>

          <div className="form-grid">
            <label>
              <span>Report type</span>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="pre_match">pre_match</option>
                <option value="post_match">post_match</option>
                <option value="round_summary">round_summary</option>
              </select>
            </label>

            <label>
              <span>Tone</span>
              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="professional">professional</option>
                <option value="fan_based">fan_based</option>
                <option value="formal">formal</option>
                <option value="casual">casual</option>
              </select>
            </label>

            <label>
              <span>Excitement</span>
              <select
                value={excitement}
                onChange={(e) => setExcitement(e.target.value)}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </label>

            <label>
              <span>Comedic effect</span>
              <select
                value={comedicEffect}
                onChange={(e) => setComedicEffect(e.target.value)}
              >
                <option value="none">none</option>
                <option value="low">low</option>
                <option value="medium">medium</option>
              </select>
            </label>
          </div>

          <label>
            <span>Load Sample Data</span>
            <select value={sampleSelection} onChange={handleLoadSample}>
              {SAMPLE_OPTIONS.map((option) => (
                <option key={option.id || 'default'} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Match JSON</span>
            <textarea
              value={matchJson}
              onChange={(e) => setMatchJson(e.target.value)}
              spellCheck={false}
            />
            <p className="hint">
              Load a sample above, then edit this JSON manually if needed.
            </p>
          </label>

          <button type="submit" disabled={generating}>
            {generating ? 'Generating report…' : 'Generate Report'}
          </button>
          <p className="hint">
            Generation may take a minute while the model loads. Please wait.
          </p>
        </form>

        {generateError && <div className="error-box">{generateError}</div>}

        {report && (
          <>
            <h2 style={{ marginTop: '1.25rem' }}>Generated Report</h2>
            <div className="output-box">{report}</div>
          </>
        )}
      </section>
    </>
  );
}
