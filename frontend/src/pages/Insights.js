import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { Skeleton, Empty } from '../components/Layout';

const Stat = ({ l, v }) => <div className="card stat"><span>{l}</span><b>{v}</b></div>;
const ScoreChart = ({ data }) => <ResponsiveContainer width="100%" height={260}><LineChart data={data.map((d, i) => ({ ...d, n: i + 1 }))}>
  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" /><XAxis dataKey="n" /><YAxis domain={[0, 100]} /><Tooltip /><Line dataKey="percentage" name="Score %" stroke="#16a34a" strokeWidth={3} /></LineChart></ResponsiveContainer>;
function usePerf() { const [p, setP] = useState(null), { toast } = useApp(); useEffect(() => { api.get('/attempts/performance').then(setP).catch(e => toast(e.message, 'err')); }, [toast]); return p; }

export function Dashboard() {
  const { user } = useApp(), p = usePerf(), [h, setH] = useState([]);
  useEffect(() => { api.get('/attempts/history').then(setH).catch(() => {}); }, []);
  if (!p) return <Skeleton n={4} />;
  return <><h1>Welcome, {user.name.split(' ')[0]}</h1>
    <div className="grid"><Stat l="Total quizzes" v={p.totalQuizzes} /><Stat l="Completed" v={p.completed} /><Stat l="Average score" v={p.average + '%'} /><Stat l="Best score" v={p.best + '%'} /></div>
    <div className="card"><h3>Performance</h3>{p.scores.length ? <ScoreChart data={p.scores} /> : <Empty text="Complete a quiz to see your progress." to="/generate" cta="Generate Quiz" />}</div>
    <div className="card"><h3>Recent quizzes</h3>{h.length ? h.slice(0, 5).map(a => <div className="line" key={a._id}><span>{a.quizId?.title || 'Untitled Quiz'}</span><b>{a.score}/{a.total}</b><Link to={'/result/' + a._id}>View</Link></div>) : <p>No quizzes taken yet.</p>}</div></>;
}

export function Performance() {
  const p = usePerf();
  if (!p) return <Skeleton n={3} />;
  if (!p.completed) return <Empty text="No attempts yet. Take a quiz to unlock your charts." to="/generate" cta="Generate Quiz" />;
  const strong = p.topics.filter(t => t.average >= 70), weak = p.topics.filter(t => t.average < 60);
  return <><h1>Performance</h1><div className="grid"><Stat l="Average score" v={p.average + '%'} /><Stat l="Best score" v={p.best + '%'} /><Stat l="Quizzes completed" v={p.completed} /></div>
    <div className="card"><h3>Score history</h3><ScoreChart data={p.scores} /></div>
    <div className="card"><h3>Topic-wise performance</h3><ResponsiveContainer width="100%" height={260}><BarChart data={p.topics}><CartesianGrid strokeDasharray="3 3" stroke="var(--line)" /><XAxis dataKey="topic" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="average" name="Average %" fill="#16a34a" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
    <div className="grid two"><div className="card"><h3>Strong subjects</h3>{strong.length ? strong.map(t => <p key={t.topic}>{t.topic} · {t.average}%</p>) : <p>None yet. Keep practicing.</p>}</div>
      <div className="card"><h3>Weak subjects</h3>{weak.length ? weak.map(t => <p key={t.topic}>{t.topic} · {t.average}%</p>) : <p>No weak topics. Nice work.</p>}</div></div></>;
}

export function Profile() {
  const { user, setUser, toast } = useApp(), p = usePerf(), [f, setF] = useState({ name: user.name, email: user.email, password: '' }), [busy, setBusy] = useState(false);
  const save = async e => { e.preventDefault(); setBusy(true);
    try { const body = { name: f.name, email: f.email, ...(f.password ? { password: f.password } : {}) }; setUser(await api.put('/users/profile', body)); setF({ ...f, password: '' }); toast('Profile saved'); }
    catch (er) { toast(er.message, 'err'); } finally { setBusy(false); } };
  return <><h1>Profile</h1><div className="grid"><Stat l="Total quizzes" v={p ? p.totalQuizzes : '–'} /><Stat l="Average score" v={p ? p.average + '%' : '–'} /><Stat l="Best score" v={p ? p.best + '%' : '–'} /></div>
    <form className="card form" onSubmit={save}><label>Name<input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
      <label>Email<input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label>
      <label>New password (optional)<input type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></label>
      <button className="btn" disabled={busy}>Save changes</button></form></>;
}
