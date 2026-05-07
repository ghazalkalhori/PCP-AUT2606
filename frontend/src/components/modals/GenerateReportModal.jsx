import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

const labelClassName = 'text-xs text-gray-400 uppercase tracking-wide mb-1';

const contentTypesByMode = {
  match: ['Pre Match', 'Post Match', 'Round Summary'],
  competition: ['Round Summary'],
};

const writingStyles = ['Professional', 'Casual', 'Analytical', 'Dramatic'];

function OptionButton({ selected, label, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-lg text-sm font-medium transition-colors',
        selected
          ? 'border-2 border-green-500 text-green-600'
          : 'border border-gray-200 text-gray-500 hover:border-gray-300',
        className
      )}
    >
      {label}
    </button>
  );
}

function GenerateReportModal({ isOpen, onClose, type, data }) {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState(
    type === 'competition' ? 'Round Summary' : 'Pre Match'
  );
  const [writingStyle, setWritingStyle] = useState('Professional');

  useEffect(() => {
    setContentType(type === 'competition' ? 'Round Summary' : 'Pre Match');
  }, [type, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.classList.add('overflow-hidden');
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.classList.remove('overflow-hidden');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) {
    return null;
  }

  const contentTypes = contentTypesByMode[type] || contentTypesByMode.match;

  const handleGenerate = () => {
    // TODO: connect to FastAPI backend + LLM
   onClose();
    navigate('/report/result', { state: { data, contentType, writingStyle, type } });

    console.log({ data, contentType, writingStyle });
  };

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-200',
        isOpen ? 'opacity-100' : 'opacity-0'
      )}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full mx-4 md:max-w-2xl max-h-[90vh] overflow-y-auto p-8"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Generate AI Report"
      >
        <div className="flex items-start justify-between border-b border-gray-100 pb-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Generate AI Report</h2>
              <p className="text-gray-500 text-sm">Configure and generate football content</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div>
          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 mb-6">
            <p className={labelClassName}>Source</p>
            {type === 'match' ? (
              <>
                <p className="text-gray-900 font-bold mt-2">
                  {data.homeTeam.name} vs {data.awayTeam.name}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {data.competition} • {data.date} at {data.time}
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-900 font-bold mt-2">{data.name}</p>
                <p className="text-gray-500 text-sm mt-1">
                  {data.season} • Round {data.progress.current}
                </p>
              </>
            )}
          </div>

          <div className="mb-6">
            <p className={labelClassName}>Content Type</p>
            <div className="flex flex-wrap gap-3 mt-3">
              {contentTypes.map((option) => (
                <OptionButton
                  key={option}
                  label={option}
                  selected={contentType === option}
                  onClick={() => setContentType(option)}
                  className="px-6 py-3 w-full md:w-auto"
                />
              ))}
            </div>
            {type === 'competition' && (
              <p className="text-xs text-gray-400 mt-3">
                Competition reports generate round summaries only
              </p>
            )}
          </div>

          <div className="mb-6">
            <p className={labelClassName}>Writing Style</p>
            <div className="flex flex-wrap gap-3 mt-3">
              {writingStyles.map((style) => (
                <OptionButton
                  key={style}
                  label={style}
                  selected={writingStyle === style}
                  onClick={() => setWritingStyle(style)}
                  className="px-5 py-3 w-full md:w-auto"
                />
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 mb-6"></div>

          <button
            type="button"
            onClick={handleGenerate}
            className="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-base font-semibold rounded-xl py-4 transition-colors"
          >
            <Sparkles size={18} />
            Generate Report
          </button>

          <p className="text-gray-400 text-xs text-center mt-4">
            The AI will analyze the data and generate a report based on your selected style and content
            type.
          </p>
        </div>
      </div>
    </div>
  );
}

export default GenerateReportModal;
