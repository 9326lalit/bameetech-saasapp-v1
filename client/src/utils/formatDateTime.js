// Utility to format datetime
export const formatDateTime = (d) => {
  if (!d) return '—';
  const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  try {
    return format(date, 'dd MMM yyyy, hh:mm a');
  } catch {
    return date.toString();
  }
};
export default formatDateTime;