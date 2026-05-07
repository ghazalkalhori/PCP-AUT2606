import { clsx } from 'clsx';

const statusStyles = {
  live: 'bg-pink-100 text-pink-700 border-pink-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  upcoming: 'bg-violet-100 text-violet-700 border-violet-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  approved: 'bg-gray-100 text-gray-700 border-gray-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
};

const dotStyles = {
  live: 'bg-pink-500',
  completed: 'bg-emerald-500',
  upcoming: 'bg-violet-500',
  processing: 'bg-blue-500',
  approved: 'bg-gray-600',
  failed: 'bg-red-500',
};

const labelMap = {
  live: 'Live',
  completed: 'Completed',
  upcoming: 'Upcoming',
  processing: 'Processing',
  approved: 'Approved',
  failed: 'Failed',
};

function StatusBadge({ status }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusStyles[status]
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', dotStyles[status])} />
      {labelMap[status]}
    </span>
  );
}

export default StatusBadge;
