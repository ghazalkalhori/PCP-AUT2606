export default function Button({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`bg-slate-950 text-white px-4 py-2 rounded-lg hover:bg-slate-800 ${className}`}
    >
      {children}
    </button>
  );
}
