// NotFound shows a clean 404 page when the user opens an unknown route.

import { Link } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";

function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <SearchX size={32} />
        </div>

        {/* Error code */}
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
          404 Error
        </p>

        {/* Title */}
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-950">
          Page not found
        </h1>

        {/* Description */}
        <p className="mb-8 text-sm leading-6 text-slate-500">
          The page you are looking for does not exist, may have been moved, or
          the link may be incorrect.
        </p>

        {/* Action */}
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
        >
          <ArrowLeft size={16} />
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}

export default NotFound;
