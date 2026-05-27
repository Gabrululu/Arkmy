export async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes("context cancelled") || attempt === retries) throw err
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
    }
  }
  throw new Error("withRetry: exhausted retries")
}
