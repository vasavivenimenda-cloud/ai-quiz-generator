import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
const Ctx = createContext();
export const useApp = () => useContext(Ctx);
export function AppProvider({ children }) {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false), [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/users/profile')
        .then(setUser)
        .catch(e => {
          if (e.message?.toLowerCase().includes('log in') || e.message?.toLowerCase().includes('token')) {
            localStorage.removeItem('token');
          }
        })
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);
  const toast = useCallback((msg, type = 'ok') => { const id = Date.now() + Math.random(); setToasts(t => [...t, { id, msg, type }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500); }, []);
  const login = (token, u) => { localStorage.setItem('token', token); setUser(u); };
  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  return <Ctx.Provider value={{ user, setUser, ready, login, logout, toast, theme, setTheme }}>{children}
    <div className="toasts">{toasts.map(t => <div key={t.id} className={'toast ' + t.type} role="status">{t.msg}</div>)}</div></Ctx.Provider>;
}
