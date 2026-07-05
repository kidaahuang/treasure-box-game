const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface FetchOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

async function apiFetch<T>(path: string, { method = 'GET', body, token }: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message = (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string')
      ? data.error
      : 'Something went wrong';
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export interface User {
  id: number;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
  bestScore: number | null;
  gamesPlayed: number;
}

export interface GameResultPayload {
  score: number;
  result: 'win' | 'loss' | 'tie';
  treasureFound: boolean;
  boxesOpened: number;
}

export interface ScoreSummary {
  bestScore: number | null;
  gamesPlayed: number;
}

export interface LeaderboardEntry {
  username: string;
  bestScore: number;
}

export function signUp(username: string, password: string) {
  return apiFetch<AuthResponse>('/api/auth/signup', { method: 'POST', body: { username, password } });
}

export function signIn(username: string, password: string) {
  return apiFetch<AuthResponse>('/api/auth/signin', { method: 'POST', body: { username, password } });
}

export function fetchMe(token: string) {
  return apiFetch<MeResponse>('/api/me', { token });
}

export function postScore(token: string, payload: GameResultPayload) {
  return apiFetch<ScoreSummary>('/api/scores', { method: 'POST', body: payload, token });
}

export function fetchLeaderboard() {
  return apiFetch<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
}
