export function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-AU').format(new Date(value));
}
