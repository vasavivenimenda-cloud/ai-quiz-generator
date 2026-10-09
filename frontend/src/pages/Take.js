import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { Skeleton } from '../components/Layout';

const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

export function QuizPage() {
  const { id } = useParams(), nav = useNavigate(), { toast } = useApp(), key = 'quiz-' + id;
  const [quiz, setQuiz] = useState(null), [i, setI] = useState(0), [busy, setBusy] = useState(false);
  const [ans, setAns] = useState(() => JSON.parse(sessionStorage.getItem(key + '-ans') || '{}'));
  const [left, setLeft] = useState(null), start = useRef(Date.now()), done = useRef(false);
  const order = useMemo(() => quiz ? (JSON.parse(sessionStorage.getItem(key + '-ord') || 'null') || shuffle(quiz.questions.map((_, k) => k))) : [], [quiz, key]);
  useEffect(() => { api.get('/quizzes/' + id).then(q => { setQuiz(q); const t = Number(sessionStorage.getItem(key + '-t')) || q.questions.length * 60; setLeft(t); }).catch(e => { toast(e.message, 'err'); nav('/quizzes'); }); }, [id, key, nav, toast]);
  useEffect(() => { if (quiz) sessionStorage.setItem(key + '-ord', JSON.stringify(order)); }, [quiz, order, key]);
  const optOrd = useMemo(() => quiz ? (JSON.parse(sessionStorage.getItem(key + '-opt') || 'null') || quiz.questions.map(q => q.type === 'tf' ? q.options.map((_, k) => k) : shuffle(q.options.map((_, k) => k)))) : [], [quiz, key]);
  useEffect(() => { if (quiz) sessionStorage.setItem(key + '-opt', JSON.stringify(optOrd)); }, [quiz, optOrd, key]);
  useEffect(() => { sessionStorage.setItem(key + '-ans', JSON.stringify(ans)); }, [ans, key]);
  useEffect(() => { if (left === null) return; sessionStorage.setItem(key + '-t', left); if (left <= 0) { submit(true); return; } const t = setTimeout(() => setLeft(l => l - 1), 1000); return () => clearTimeout(t); }, [left]); // eslint-disable-line
  useEffect(() => { const h = e => { if (!done.current) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h); }, []);
  const submit = async auto => {
    if (done.current || !quiz) return;
    if (!auto && Object.keys(ans).length < quiz.questions.length && !window.confirm('Some questions are unanswered. Submit anyway?')) return;
    done.current = true; setBusy(true);
    try { const total = quiz.questions.length * 60, a = await api.post('/attempts', { quizId: id, answers: quiz.questions.map((_, k) => ans[k] || []), timeTaken: total - Math.max(left, 0) });
      ['-ans', '-ord', '-t', '-opt'].forEach(s => sessionStorage.removeItem(key + s)); if (auto) toast("Time's up. Quiz submitted."); nav('/result/' + a._id); }
    catch (e) { done.current = false; setBusy(false); toast(e.message, 'err'); }
  };
  if (!quiz || !quiz.questions || !quiz.questions.length) return <Skeleton n={1} />;
  const qi = order[i] ?? 0, q = quiz.questions[qi] || quiz.questions[0], sel = ans[qi] || [], multi = q.type === 'multi';
  const pick = o => setAns({ ...ans, [qi]: multi ? (sel.includes(o) ? sel.filter(x => x !== o) : [...sel, o]) : [o] });
  return <div className="quizbox"><div className="row between"><h2>{quiz.title}</h2><span className={'timer' + (left !== null && left < 30 ? ' low' : '')}>{left !== null ? fmt(Math.max(left, 0)) : '--:--'}</span></div>
    <div className="bar"><div style={{ width: ((i + 1) / quiz.questions.length * 100) + '%' }} /></div>
    <div className="card"><small>Question {i + 1} of {quiz.questions.length} · {multi ? 'Select all that apply' : 'Select one'}</small><h3>{q.question}</h3>
      {(optOrd[qi] || q.options.map((_, k) => k)).map(k => <button key={k} className={'opt' + (sel.includes(k) ? ' on' : '')} onClick={() => pick(k)}>{q.options[k]}</button>)}</div>
    <div className="row between"><button className="ghost btn" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button>
      {i < quiz.questions.length - 1 ? <button className="btn" onClick={() => setI(i + 1)}>Next</button> : <button className="btn" disabled={busy} onClick={() => submit(false)}>Submit Quiz</button>}</div>
    {i < quiz.questions.length - 1 && <button className="linklike" onClick={() => submit(false)}>Submit Quiz now</button>}</div>;
}

export function Result() {
  const { id } = useParams(), [a, setA] = useState(null), { toast } = useApp();
  useEffect(() => { api.get('/attempts/' + id).then(setA).catch(e => toast(e.message, 'err')); }, [id, toast]);
  if (!a) return <Skeleton n={2} />;
  const qz = a.quizId, p = a.percentage ?? 0, msg = p >= 80 ? 'Excellent' : p >= 60 ? 'Good job' : 'Keep practicing';
  if (!qz) return <div className="card empty"><p>Quiz details could not be found.</p><Link className="btn" to="/quizzes">Back to Quizzes</Link></div>;
  return <><h1>{msg}! You scored {a.score}/{a.total}.</h1>
    <div className="grid"><div className="card stat"><span>Percentage</span><b>{p}%</b></div><div className="card stat"><span>Correct</span><b>{a.correctAnswers}</b></div>
      <div className="card stat"><span>Wrong</span><b>{a.wrongAnswers}</b></div><div className="card stat"><span>Time taken</span><b>{fmt(a.timeTaken)}</b></div></div>
    <div className="row noprint"><Link className="btn" to={'/quiz/' + qz._id}>Try Again</Link><Link className="ghost btn" to="/generate">Generate Another Quiz</Link>
      <Link className="ghost btn" to="/performance">View Performance</Link><button className="ghost btn" onClick={() => window.print()}>Download PDF</button></div>
    {(qz.questions || []).map((q, k) => { const u = a.answers?.[k] || [], ok = [...u].sort().join() === [...(q.correct || [])].sort().join(); const names = l => l.length ? l.map(x => q.options[x]).join(', ') : 'No answer';
      return <div key={k} className={'card review ' + (ok ? 'good' : 'bad')}><small>Question {k + 1} · {ok ? 'Correct' : 'Wrong'}</small><h3>{q.question}</h3>
        <p>Your answer: <b>{names(u)}</b></p><p>Correct answer: <b>{names(q.correct || [])}</b></p><p className="expl">{q.explanation}</p></div>; })}</>;
}

