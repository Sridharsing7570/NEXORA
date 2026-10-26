/** True if `error` (or its cause, as Drizzle wraps driver errors) is a Postgres unique violation. */
export function isUniqueViolation(
  error: unknown,
  constraint?: string,
): boolean {
  for (
    let current: unknown = error;
    current;
    current = (current as { cause?: unknown }).cause
  ) {
    const pgError = current as { code?: string; constraint?: string };
    if (pgError.code === '23505') {
      return constraint === undefined || pgError.constraint === constraint;
    }
  }
  return false;
}
