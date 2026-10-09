import { NavLink, Outlet, Navigate, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
const links = [['/dashboard', 'Dashboard'], ['/generate', 'Generate Quiz'], ['/quizzes', 'My Quizzes'], ['/history', 'Quiz History'], ['/performance', 'Performance'], ['/profile', 'Profile']];
export const Logo = () => <span className="logo"><span className="logo-mark">Q</span>AI Quiz Generator</span>;
export function Protected() {
  const { user, ready, logout, theme, setTheme } = useApp(), nav = useNavigate();
  if (!ready) return <div className="center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <div className="shell"><aside className="side"><Logo />
    <nav>{links.map(([to, t]) => <NavLink key={to} to={to}>{t}</NavLink>)}
      <button className="linklike" onClick={() => { logout(); nav('/'); }}>Logout</button></nav>
    <button className="ghost small" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? 'Dark mode' : 'Light mode'}</button></aside>
    <main className="main"><Outlet /></main></div>;
}
export const Skeleton = ({ n = 3 }) => <div className="grid">{Array.from({ length: n }, (_, i) => <div key={i} className="card skel" />)}</div>;
export const Empty = ({ text, to, cta }) => <div className="card empty"><p>{text}</p>{to && <Link className="btn" to={to}>{cta}</Link>}</div>;

