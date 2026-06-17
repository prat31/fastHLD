import type { InstructRequest, InstructResponse } from '../types/diagram';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export async function postInstruct(req: InstructRequest): Promise<InstructResponse> {
  const resp = await fetch(`${BASE_URL}/api/diagram/instruct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`API error ${resp.status}: ${detail}`);
  }
  return resp.json() as Promise<InstructResponse>;
}

export async function getHealth(): Promise<{ status: string; provider: string }> {
  const resp = await fetch(`${BASE_URL}/api/health`);
  if (!resp.ok) throw new Error('Health check failed');
  return resp.json();
}
