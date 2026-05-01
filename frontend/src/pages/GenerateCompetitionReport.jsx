import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { ArrowLeft, Sparkles } from 'lucide-react';

const writingStyles = ['Professional', 'Casual', 'Analytical', 'Dramatic'];

function GenerateCompetitionReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const { competition } = location.state || {};
  const [writingStyle, setWritingStyle] = useState('Professional');

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleGenerateReport = () => {
    // TODO: connect to FastAPI backend + LLM
    console.log({ competition, contentType: 'Round Summary', writingStyle });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Generate Report</h1>
          <p className="mt-0.5 text-sm text-gray-400">AI-powered football match report generation</p>
        </div>
        <p className="text-sm text-gray-500">{todayLabel}</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <section className="mb-4 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Generate AI Report</h2>
              <p className="text-sm text-gray-500">Configure and generate football content</p>
            </div>
          </div>
        </section>

        <section className="mb-4 rounded-xl bg-white p-6 shadow-sm">
          <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">Source</p>
          <h3 className="text-lg font-bold text-gray-900">{competition?.name || 'Competition not found'}</h3>
          <p className="text-sm text-gray-500">
            {competition
              ? `${competition.season} • Round ${competition.progress.current}`
              : 'Competition data was not passed through navigation state.'}
          </p>
          {/* TODO: replace with Dribl API data later */}
        </section>

        <section className="mb-4 rounded-xl bg-white p-6 shadow-sm">
          <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">Content Type</p>
          <button
            type="button"
            className="rounded-lg border-2 border-green-500 bg-white px-4 py-2.5 text-sm font-medium text-green-600"
          >
            Round Summary
          </button>
          <p className="mt-3 text-xs text-gray-400">Competition reports generate round summaries only</p>
        </section>

        <section className="mb-4 rounded-xl bg-white p-6 shadow-sm">
          <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">Writing Style</p>
          <div className="flex flex-wrap gap-3">
            {writingStyles.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setWritingStyle(style)}
                className={clsx(
                  'rounded-lg bg-white px-4 py-2.5 text-sm font-medium transition-colors',
                  writingStyle === style
                    ? 'border-2 border-green-500 text-green-600'
                    : 'border border-gray-200 text-gray-500'
                )}
              >
                {style}
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={handleGenerateReport}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3 text-white font-semibold transition-colors hover:bg-green-600"
        >
          <Sparkles size={16} />
          Generate Report
        </button>

        <section className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">
            The AI will analyze the match or league data and generate a comprehensive report based
            on your selected style and content type.
          </p>
        </section>
      </div>
    </div>
  );
}

export default GenerateCompetitionReport;
