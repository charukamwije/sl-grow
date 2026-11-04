/**
 * Read the `message` of anything that was thrown, if it has one
 */
export const getErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  const message = (error as { message?: unknown } | null)?.message;

  return typeof message === 'string' && message ? message : fallback;
};
