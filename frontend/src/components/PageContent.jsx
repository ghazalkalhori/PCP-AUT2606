import { clsx } from 'clsx';

/**
 * Centered max-width wrapper for page body (below full-width PageHeader).
 * Matches previous DashboardLayout inner padding.
 */
export default function PageContent({ children, className }) {
  return (
    <div
      className={clsx(
        'mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:px-8 lg:px-10 lg:py-8 xl:px-12',
        className
      )}
    >
      {children}
    </div>
  );
}
