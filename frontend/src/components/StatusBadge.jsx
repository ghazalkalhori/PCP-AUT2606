import { clsx } from "clsx";

const statusStyles = {
  live: "bg-pink-100 text-pink-700 border-pink-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  upcoming: "bg-violet-100 text-violet-700 border-violet-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  submitted: "bg-violet-100 text-violet-700 border-violet-200",
  approved: "bg-gray-100 text-gray-700 border-gray-200",
  published: "bg-sky-100 text-sky-700 border-sky-200",
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  review: "bg-amber-100 text-amber-700 border-amber-200",
  failed: "bg-red-100 text-red-700 border-red-200",
};

const dotStyles = {
  live: "bg-pink-500",
  completed: "bg-emerald-500",
  upcoming: "bg-violet-500",
  processing: "bg-blue-500",
  submitted: "bg-violet-500",
  approved: "bg-gray-600",
  published: "bg-sky-500",
  draft: "bg-slate-500",
  review: "bg-amber-500",
  failed: "bg-red-500",
};

const labelMap = {
  live: "Live",
  completed: "Completed",
  upcoming: "Upcoming",
  processing: "Processing",
  submitted: "Submitted",
  approved: "Approved",
  published: "Published",
  draft: "Draft",
  review: "Review",
  failed: "Failed",
};

function StatusBadge({ status }) {
  const normalizedStatus = String(status || "draft").toLowerCase();

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        statusStyles[normalizedStatus] || statusStyles.draft,
      )}
    >
      <span
        className={clsx(
          "w-1.5 h-1.5 rounded-full",
          dotStyles[normalizedStatus] || dotStyles.draft,
        )}
      />
      {labelMap[normalizedStatus] || status}
    </span>
  );
}

export default StatusBadge;
