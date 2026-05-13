import { mockContentReports } from './mockData/contentReports.js';
// import { apiRequest } from './apiClient.js';

/**
 * Service for the Content Library / Content Report Detail pages.
 *
 * Every function is async and returns a Promise so callers can be written
 * once and stay the same when we switch from mock data to the real backend.
 *
 * To go live, replace the mock bodies below with the commented-out
 * `apiRequest(...)` calls — no caller changes required.
 */

// Internal: hold mock records in a module-scoped array so update/approve/publish
// can simulate mutations between calls. Real backend calls won't need this.
let contentReports = [...mockContentReports];

/**
 * Returns the full list of generated content reports.
 *
 * Backend later:
 *   return apiRequest('/reports');
 */
export async function getContentReports() {
  return Promise.resolve(contentReports);
}

/**
 * Returns a single content report by id.
 *
 * Accepts either the content id (`CONT-…`) or the report id (`RPT-…`),
 * so URLs like `/content/CONT-001` and `/content/RPT-001` both resolve.
 *
 * Backend later:
 *   return apiRequest(`/reports/${contentId}`);
 */
export async function getContentReportById(contentId) {
  if (!contentId) {
    return Promise.resolve(null);
  }
  const report = contentReports.find(
    (r) => r.id === contentId || r.reportId === contentId
  );
  return Promise.resolve(report || null);
}

/**
 * Updates a content report (e.g. edited content, tone, etc).
 *
 * Backend later:
 *   return apiRequest(`/reports/${contentId}`, {
 *     method: 'PUT',
 *     body: JSON.stringify(payload),
 *   });
 */
export async function updateContentReport(contentId, payload) {
  let updated = null;

  contentReports = contentReports.map((report) => {
    const isMatch =
      report.id === contentId || report.reportId === contentId;
    if (!isMatch) {
      return report;
    }
    updated = {
      ...report,
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    return updated;
  });

  return Promise.resolve(updated);
}

/**
 * Marks a content report as approved.
 *
 * Backend later:
 *   return apiRequest(`/reports/${contentId}/approve`, { method: 'POST' });
 */
export async function approveContentReport(contentId) {
  return updateContentReport(contentId, { status: 'Approved' });
}

/**
 * Marks a content report as published.
 *
 * Backend later:
 *   return apiRequest(`/reports/${contentId}/publish`, { method: 'POST' });
 */
export async function publishContentReport(contentId) {
  return updateContentReport(contentId, { status: 'Published' });
}
