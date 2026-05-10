export default function FormInput({ label, ...props }) {
  return (
    <div className="mb-4">
      <label className="block mb-1 text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        {...props}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-400 outline-none"
      />
    </div>
  );
}
