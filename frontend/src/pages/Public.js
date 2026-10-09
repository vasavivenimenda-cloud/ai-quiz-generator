import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Layout';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const features = [['Generate from anything', 'Type a topic, paste notes or upload a PDF and get a quiz in seconds.'], ['Explained answers', 'Every question comes with the correct answer and a clear explanation.'],
  ['Adaptive difficulty', 'Quizzes get harder or easier based on your recent scores.'], ['Progress charts', 'See score history and which topics are strong or weak.']];
const steps = [['Add your material', 'Enter a topic, paste text or upload a file.'], ['Choose settings', 'Pick question count, difficulty and type.'], ['Take the quiz', 'Answer against a timer, then review every explanation.']];
export function Landing() {
  const { user } = useApp();
  return <div className="landing">
    <header className="top"><Logo /><div className="row"><Link className="ghost btn" to={user ? '/dashboard' : '/login'}>{user ? 'Dashboard' : 'Login'}</Link>{!user && <Link className="btn" to="/register">Register</Link>}</div></header>
    <section className="hero"><div><h1>Turn Your Study Material Into Smart Quizzes</h1>
      <p className="lead">Generate personalized AI-powered quizzes from topics, text, and study materials in seconds.</p>
      <div className="row"><Link className="btn big" to="/generate">Generate Quiz</Link><Link className="btn big ghost" to="/quizzes">Take a Quiz</Link></div></div>
      <div className="card sample"><b>Photosynthesis · Medium</b><p>Which organelle carries out photosynthesis?</p>
        {['Mitochondrion', 'Chloroplast', 'Ribosome', 'Nucleus'].map((o, i) => <div key={o} className={'opt' + (i === 1 ? ' on' : '')}>{o}</div>)}</div></section>
    <section className="sec"><h2>Features</h2><div className="grid">{features.map(([t, d]) => <div className="card" key={t}><h3>{t}</h3><p>{d}</p></div>)}</div></section>
    <section className="sec alt"><h2>How it works</h2><div className="grid">{steps.map(([t, d], i) => <div className="card" key={t}><span className="num">{i + 1}</span><h3>{t}</h3><p>{d}</p></div>)}</div></section>
    <section className="sec"><h2>Benefits</h2><ul className="benefits"><li>Turn long notes into active recall practice</li><li>Spot weak topics before the exam</li><li>Save hours of writing practice questions</li></ul></section>
    <footer className="foot">© {new Date().getFullYear()} AI Quiz Generator · B.Tech Final Year Project</footer></div>;
}

export function Auth({ mode }) {
  const reg = mode === 'register', nav = useNavigate(), { login, toast } = useApp();
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '' }), [e, setE] = useState({}), [busy, setBusy] = useState(false);
  useEffect(() => { setE({}); }, [mode]);
  const set = k => ev => setF({ ...f, [k]: ev.target.value });
  const submit = async ev => {
    ev.preventDefault();
    const x = {};
    if (reg && !f.name.trim()) x.name = 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) x.email = 'Enter a valid email';
    if (f.password.length < 6) x.password = 'Use at least 6 characters';
    if (reg && f.confirm !== f.password) x.confirm = 'Passwords do not match';
    setE(x); if (Object.keys(x).length) return;
    setBusy(true);
    try { const d = await api.post('/auth/' + mode, f); login(d.token, d.user); toast(reg ? 'Account created' : 'Welcome back'); nav('/dashboard'); }
    catch (er) { toast(er.message, 'err'); } finally { setBusy(false); }
  };
  const field = (k, label, type = 'text') => <label>{label}<input type={type} value={f[k]} onChange={set(k)} autoComplete={k === 'password' ? 'current-password' : undefined} />{e[k] && <small className="error">{e[k]}</small>}</label>;
  return <div className="center authbg"><form className="card auth" onSubmit={submit} noValidate><Logo /><h2>{reg ? 'Create your account' : 'Log in'}</h2>
    {reg && field('name', 'Name')}{field('email', 'Email', 'email')}{field('password', 'Password', 'password')}{reg && field('confirm', 'Confirm password', 'password')}
    <button className="btn" disabled={busy}>{busy ? 'Please wait…' : reg ? 'Register' : 'Login'}</button>
    <p>{reg ? 'Already registered? ' : 'New here? '}<Link to={reg ? '/login' : '/register'}>{reg ? 'Login' : 'Register'}</Link></p></form></div>;
}
