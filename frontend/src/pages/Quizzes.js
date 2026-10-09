import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { Skeleton, Empty } from '../components/Layout';

export function Generate() {
  const nav = useNavigate(), { toast } = useApp();
  const [tab, setTab] = useState('topic'), [topic, setTopic] = useState(''), [pasted, setPasted] = useState(''), [file, setFile] = useState(null);
  const [count, setCount] = useState(10), [difficulty, setDifficulty] = useState('medium'), [type, setType] = useState('mixed'), [busy, setBusy] = useState(false);
  const go = async () => {
    const fd = new FormData(); fd.append('count', count); fd.append('difficulty', difficulty); fd.append('type', type);
    if (tab === 'topic') fd.append('topic', topic); if (tab === 'text') fd.append('pasted', pasted); if (tab === 'file') { if (!file) return toast('Choose a PDF or text file', 'err'); fd.append('file', file); fd.append('topic', topic); }
    if (tab === 'topic' && topic.trim().length < 2) return toast('Enter a topic first', 'err');
    if (tab === 'text' && pasted.trim().length < 30) return toast('Paste at least a few sentences', 'err');
    setBusy(true);
    try { const q = await api.post('/quizzes/generate', fd); toast('Quiz ready'); nav('/quiz/' + q._id); } catch (e) { toast(e.message, 'err'); setBusy(false); }
  };
  const Seg = ({ v, set, opts }) => <div className="seg">{opts.map(([k, l]) => <button type="button" key={k} className={v === k ? 'on' : ''} onClick={() => set(k)}>{l}</button>)}</div>;
  return <><h1>Generate Quiz</h1><div className="card form">
    <Seg v={tab} set={setTab} opts={[['topic', 'Enter a topic'], ['text', 'Paste study material'], ['file', 'Upload PDF / text']]} />
    {tab !== 'text' && <label>Topic<input value={topic} placeholder="e.g. Operating system scheduling" onChange={e => setTopic(e.target.value)} /></label>}
    {tab === 'text' && <label>Study material<textarea rows="8" value={pasted} onChange={e => setPasted(e.target.value)} placeholder="Paste your notes here" /></label>}
    {tab === 'file' && <label>File (PDF or .txt, up to 5 MB)<input type="file" accept=".pdf,.txt,text/plain,application/pdf" onChange={e => setFile(e.target.files[0])} /></label>}
    <label>Number of questions</label><Seg v={count} set={setCount} opts={[5, 10, 15, 20].map(n => [n, n])} />
    <label>Difficulty</label><Seg v={difficulty} set={setDifficulty} opts={[['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard'], ['adaptive', 'Adaptive']]} />
    <label>Question type</label><Seg v={type} set={setType} opts={[['mcq', 'MCQ'], ['tf', 'True/False'], ['multi', 'Multiple Select'], ['mixed', 'Mixed']]} />
    <button className="btn big" onClick={go} disabled={busy}>Generate Quiz with AI</button></div>
    {busy && <div className="overlay"><div className="spinner" /><p>Writing your questions…</p></div>}</>;
}

export function MyQuizzes() {
  const [qs, setQs] = useState(null), { toast } = useApp();
  useEffect(() => { api.get('/quizzes').then(setQs).catch(e => toast(e.message, 'err')); }, [toast]);
  const share = id => navigator.clipboard.writeText(window.location.origin + '/quiz/' + id).then(() => toast('Link copied. Anyone logged in can take this quiz.'));
  if (!qs) return <Skeleton />;
  return <><h1>My Quizzes</h1>{qs.length ? <div className="grid">{qs.map(q => <div className="card" key={q._id}><h3>{q.title}</h3>
    <p>{q.questionCount} questions · {q.difficulty} · {new Date(q.createdAt).toLocaleDateString()}</p>
    <div className="row"><Link className="btn small" to={'/quiz/' + q._id}>Take quiz</Link><button className="ghost btn small" onClick={() => share(q._id)}>Share</button></div></div>)}</div>
    : <Empty text="You have not generated any quizzes yet." to="/generate" cta="Generate Quiz" />}</>;
}

export function History() {
  const [h, setH] = useState(null), [s, setS] = useState(''), [d, setD] = useState('all'), { toast } = useApp();
  useEffect(() => { api.get('/attempts/history').then(setH).catch(e => toast(e.message, 'err')); }, [toast]);
  if (!h) return <Skeleton />;
  const rows = h.filter(a => (d === 'all' || (a.quizId?.difficulty || 'medium') === d) && (a.quizId?.topic || 'General').toLowerCase().includes(s.toLowerCase()));
  return <><h1>Quiz History</h1><div className="row"><input placeholder="Search by topic" value={s} onChange={e => setS(e.target.value)} />
    <select value={d} onChange={e => setD(e.target.value)}><option value="all">All difficulties</option><option>easy</option><option>medium</option><option>hard</option></select></div>
    {rows.length ? <div className="card scroll"><table><thead><tr><th>Topic</th><th>Questions</th><th>Score</th><th>%</th><th>Difficulty</th><th>Date</th><th /></tr></thead><tbody>
      {rows.map(a => <tr key={a._id}><td>{a.quizId?.topic || 'General'}</td><td>{a.total}</td><td>{a.score}/{a.total}</td><td>{a.percentage}%</td><td>{a.quizId?.difficulty || '–'}</td>
        <td>{new Date(a.completedAt).toLocaleDateString()}</td><td><Link to={'/result/' + a._id}>View Result</Link></td></tr>)}</tbody></table></div>
      : <Empty text="No matching quiz attempts." to="/generate" cta="Generate Quiz" />}</>;
}
