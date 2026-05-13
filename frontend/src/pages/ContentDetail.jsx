import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageContent from '../components/PageContent.jsx';
import PageHeader from '../components/PageHeader.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import useContentReport from '../hooks/useContentReport.js';

/**
 * Temporary placeholder page for the Content Report Detail screen.
 *
 * Goal of this file: prove the route `/content/:contentId`, the hook
 * `useContentReport`, and the service lookup all wire together correctly.
 *
 * The full detail UI will be built on top of this page — the data layer
 * here (route param → hook → service) should not need to change.
 */
function ContentDetail() {
  const { contentId } = useParams();
  const { report, loading, error } = useContentReport(contentId);

  return (
    <>
      <PageHeader
        title="Content Report"
        description="Temporary placeholder — routing and data lookup test"
      />
      <PageContent>
        <div className="space-y-6">
          <div>
            <Link
              to="/content"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={15} /> Back to Content
            </Link>
          </div>

          {loading && (
            <div className="flex justify-center py-10">
              <LoadingSpinner />
            </div>
          )}

          {error && !loading && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Failed to load report. Please try again.
            </div>
          )}

          {!loading && !error && !report && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                Report not found
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                No content report matches the id <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{contentId}</code>.
              </p>
            </div>
          )}

          {!loading && !error && report && (
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">{report.title}</h2>

              <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Content ID" value={report.id} />
                <Field label="Report ID" value={report.reportId} />
                <Field label="Status" value={report.status} />
                <Field label="Report Type" value={report.reportType} />
                <Field label="Created" value={formatDate(report.createdAt)} />
              </dl>

              <p className="mt-6 text-xs text-gray-400">
                This is a placeholder page. The full Content Report Detail UI
                will replace this content while keeping the same route, hook,
                and service.
              </p>
            </div>
          )}
        </div>
      </PageContent>
    </>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-800">{value ?? '—'}</dd>
    </div>
  );
}

function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default ContentDetail;
