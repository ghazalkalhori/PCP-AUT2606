import { useEffect, useState } from 'react';
import { getContentReportById } from '../services/contentService.js';

/**
 * Loads a single content report by its content id (or report id).
 *
 * Keeps page components free of fetch / service logic — the page just
 * renders whatever `{ report, loading, error }` is in.
 *
 * When the backend goes live, only `contentService.getContentReportById`
 * changes; this hook and its callers stay the same.
 *
 * @param {string|undefined} contentId Value from `useParams()`.
 * @returns {{ report: object|null, loading: boolean, error: Error|null }}
 */
export default function useContentReport(contentId) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!contentId) {
      setReport(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    async function loadReport() {
      setLoading(true);
      setError(null);
      try {
        const data = await getContentReportById(contentId);
        if (!cancelled) {
          setReport(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setReport(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [contentId]);

  return { report, loading, error };
}
