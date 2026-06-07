export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export async function apiFetch(path, options = {}) {
  const res = await fetch(API_URL + path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }

  return res.json();
}
