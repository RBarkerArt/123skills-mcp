// Thin client for the 123skills public API.
export const BASE = process.env.SKILLS123_BASE ?? 'https://123skills.site'

export class ApiError extends Error {
  status: number
  code?: string
  constructor(status: number, body: { error?: string; code?: string }) {
    super(body.error ?? `HTTP ${status}`)
    this.status = status
    this.code = body.code
  }
}

export async function call(path: string, opts: {
  method?: string
  key?: string
  body?: unknown
} = {}): Promise<unknown> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (opts.key) headers.authorization = `Bearer ${opts.key}`
  const r = await fetch(BASE + path, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError(r.status, data as { error?: string; code?: string })
  return data
}
