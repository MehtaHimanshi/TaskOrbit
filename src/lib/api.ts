/** Express API (see /server). Override with VITE_API_URL in .env */
export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:4000';

export async function fetchAppState(): Promise<Response> {
  return fetch(`${API_BASE}/api/state`);
}

export async function saveAppState(body: unknown): Promise<Response> {
  return fetch(`${API_BASE}/api/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
