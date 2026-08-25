// Thin client for the 123skills public API.
export const BASE = process.env.SKILLS123_BASE ?? 'https://123skills.site';
export class ApiError extends Error {
    status;
    code;
    constructor(status, body) {
        super(body.error ?? `HTTP ${status}`);
        this.status = status;
        this.code = body.code;
    }
}
export async function call(path, opts = {}) {
    const headers = { 'content-type': 'application/json' };
    if (opts.key)
        headers.authorization = `Bearer ${opts.key}`;
    const r = await fetch(BASE + path, {
        method: opts.method ?? 'GET',
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok)
        throw new ApiError(r.status, data);
    return data;
}
