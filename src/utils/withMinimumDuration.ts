/** Tiempo mínimo visible del skeleton para evitar parpadeos (flash skeleton → lista). */
export const MIN_SKELETON_MS = 200;

export async function withMinimumDuration<T>(work: Promise<T>, minMs: number): Promise<T> {
  const started = Date.now();
  const result = await work;
  const elapsed = Date.now() - started;
  if (elapsed < minMs) {
    await new Promise<void>((resolve) => setTimeout(resolve, minMs - elapsed));
  }
  return result;
}
