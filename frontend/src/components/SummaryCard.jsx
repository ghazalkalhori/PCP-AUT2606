function SummaryCard({ label, value }) {
  return (
    <section className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}

export default SummaryCard;
