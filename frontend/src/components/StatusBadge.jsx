import { clsx } from 'clsx';

const statusStyles = {
  live: 'bg-pink-100 text-pink-700 border-pink-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  upcoming: 'bg-violet-100 text-violet-700 border-violet-200',
};

const dotStyles = {
  live: 'bg-pink-500',
  completed: 'bg-emerald-500',
  upcoming: 'bg-violet-500',
};

const labelMap = {
  live: 'Live',
  completed: 'Completed',
  upcoming: 'Upcoming',
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
