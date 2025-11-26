/**
 * Lightweight LMRA API helper
 * - createLMRA: POST /api/lmras/create
 * - updateLMRA: PUT  /api/lmras/[lmraId]
 *
 * Note: uses fetch; caller should handle auth headers if required by runtime.
 */

export type LMRAPayload = Record<string, any>;

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`LMRA API request failed: ${res.status} ${res.statusText} ${text}`);
    // @ts-expect-error attach body for debugging
    err.body = text;
    throw err;
  }
  return res.json();
}

export async function createLMRA(payload: LMRAPayload) {
  const res = await fetch("/api/lmras/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateLMRA(lmraId: string, payload: LMRAPayload) {
  const res = await fetch(`/api/lmras/${encodeURIComponent(lmraId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}
