function formatHeaderDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Full-width top bar in the main column (below sidebar): title + subtitle (left), date (right).
 */
function PageHeader({ title, description, subtitle, actions }) {
  const sub = subtitle ?? description;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const dateIso = `${y}-${m}-${d}`;
  const dateLabel = formatHeaderDate(now);

  return (
    <header className="w-full shrink-0 border-b border-gray-200 bg-white px-6 py-5 sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {title}
          </h1>
          {sub ? (
            <p className="mt-1 text-sm leading-relaxed text-gray-500">{sub}</p>
          ) : null}
        </div>

        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:max-w-[min(100%,20rem)] sm:items-end sm:shrink-0 sm:pt-0.5">
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
          ) : null}
          <time
            dateTime={dateIso}
            className="text-sm text-gray-500 sm:text-right"
          >
            {dateLabel}
          </time>
        </div>
      </div>
    </header>
  );
}

export default PageHeader;
