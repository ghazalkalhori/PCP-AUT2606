function EmptyState({ title = 'No data yet', message }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      {message && <p>{message}</p>}
    </div>
  );
}

export default EmptyState;
