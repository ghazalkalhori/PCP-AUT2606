import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

const contentTypes = ['Pre Match', 'Post Match', 'Round Summary'];
const writingStyles = ['Professional', 'Casual', 'Analytical', 'Dramatic'];

function ToggleOption({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
        selected
          ? 'border-emerald-500 text-emerald-600'
          : 'border-gray-300 text-gray-500 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  );
}

function GenerateReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const match = location.state?.match;

  const [selectedContentType, setSelectedContentType] = useState('Pre Match');
  const [selectedWritingStyle, setSelectedWritingStyle] = useState('Professional');

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const matchTitle = match
    ? `${match.homeTeam.name} vs ${match.awayTeam.name}`
    : 'Match not available';
  const matchMeta = match
    ? `${match.competition} • ${match.date} at ${match.time}`
    : 'Match data was not passed through navigation state.';

  const handleGenerateReport = () => {
    console.log('Generate report payload:', {
      matchId: match?.id ?? null,
      match,
      contentType: selectedContentType,
      writingStyle: selectedWritingStyle,
    });
  };

  return (
    <div className="min-h-full bg-[#f5f6fa]">
      <div className="mx-auto w-full max-w-[600px] space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Generate Report</h1>
            <p className="mt-1 text-sm text-gray-500">AI-powered football match report generation</p>
          </div>
          <p className="pt-1 text-sm text-gray-500">{todayLabel}</p>
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Generate AI Report</h2>
              <p className="text-sm text-gray-500">Configure and generate football content</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Source</p>
          <h3 className="mt-3 text-lg font-semibold text-gray-900">{matchTitle}</h3>
          <p className="mt-1 text-sm text-gray-500">{matchMeta}</p>
          <p className="mt-2 text-sm text-gray-500">Emirates Stadium</p>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-base font-semibold text-gray-900">Content Type</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {contentTypes.map((type) => (
              <ToggleOption
                key={type}
                label={type}
                selected={selectedContentType === type}
                onClick={() => setSelectedContentType(type)}
              />
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-base font-semibold text-gray-900">Writing Style</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {writingStyles.map((style) => (
              <ToggleOption
                key={style}
                label={style}
                selected={selectedWritingStyle === style}
                onClick={() => setSelectedWritingStyle(style)}
              />
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={handleGenerateReport}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#22c55e] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
        >
          <Sparkles size={16} />
          Generate Report
        </button>

        <section className="rounded-xl bg-gray-100 p-6">
          <p className="text-sm text-gray-600">
            The AI will analyze the match or league data and generate a comprehensive report based
            on your selected style and content type.
          </p>
        </section>
      </div>
    </div>
  );
}

export default GenerateReport;
