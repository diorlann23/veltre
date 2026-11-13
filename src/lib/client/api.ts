export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string> = {},
  ) {
    super(message)
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
      headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: 'same-origin',
      signal: init.signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiError('You appear to be offline. Check your connection and try again.', 0)
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string> }
  if (!res.ok) throw new ApiError(data.error ?? 'Something went wrong. Please try again.', res.status, data.fields ?? {})
  return data as T
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.'
}
