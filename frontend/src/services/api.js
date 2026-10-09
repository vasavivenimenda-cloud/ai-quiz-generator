const B = process.env.REACT_APP_API || 'http://localhost:5000/api';
async function req(p, o = {}) {
  const t = localStorage.getItem('token'), form = o.body instanceof FormData;
  const r = await fetch(B + p, { ...o, headers: { ...(o.body && !form ? { 'Content-Type': 'application/json' } : {}), ...(t ? { Authorization: 'Bearer ' + t } : {}) },
    body: o.body && !form ? JSON.stringify(o.body) : o.body });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || 'Request failed');
  return d;
}
export const api = { get: p => req(p), post: (p, b) => req(p, { method: 'POST', body: b }), put: (p, b) => req(p, { method: 'PUT', body: b }) };
