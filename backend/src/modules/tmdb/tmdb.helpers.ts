export const parseTmdbId = (raw: unknown): number | null => {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) {
    return raw;
  }
  if (typeof raw === 'string' && /^\d+$/.test(raw)) {
    const parsed = parseInt(raw, 10);
    return parsed > 0 ? parsed : null;
  }
  return null;
};