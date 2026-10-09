const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken'), pdf = require('pdf-parse');
const { User, Quiz, QuizAttempt } = require('../models');
const ai = require('../services/ai');
const err = (m, s = 400) => Object.assign(new Error(m), { status: s });
const sign = u => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = u => ({ id: u._id, name: u.name, email: u.email, createdAt: u.createdAt });
const emailOk = e => /^\S+@\S+\.\S+$/.test(e || '');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !emailOk(email) || (password || '').length < 6) throw err('Enter a name, a valid email and a password of 6+ characters');
  if (await User.findOne({ email: email.toLowerCase() })) throw err('An account with this email already exists', 409);
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(u), user: pub(u) });
};
exports.login = async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) throw err('Incorrect email or password', 401);
  res.json({ token: sign(u), user: pub(u) });
};
exports.getProfile = async (req, res) => res.json(pub(await User.findById(req.userId)));
exports.updateProfile = async (req, res) => {
  const { name, email, password } = req.body, u = await User.findById(req.userId);
  if (name !== undefined) { if (!name.trim()) throw err('Name cannot be empty'); u.name = name.trim(); }
  if (email !== undefined) {
    if (!emailOk(email)) throw err('Enter a valid email');
    if (await User.findOne({ email: email.toLowerCase(), _id: { $ne: u._id } })) throw err('Email already in use', 409);
    u.email = email;
  }
  if (password) { if (password.length < 6) throw err('Password must be 6+ characters'); u.password = await bcrypt.hash(password, 10); }
  await u.save(); res.json(pub(u));
};

exports.generate = async (req, res) => {
  const { topic = '', pasted = '', count, difficulty = 'medium', type = 'mixed' } = req.body;
  const n = Number(count);
  if (![5, 10, 15, 20].includes(n)) throw err('Choose 5, 10, 15 or 20 questions');
  if (!['easy', 'medium', 'hard', 'adaptive'].includes(difficulty) || !['mcq', 'tf', 'multi', 'mixed'].includes(type)) throw err('Invalid quiz settings');
  let content = pasted.trim();
  if (req.file) {
    try {
      content = req.file.mimetype === 'application/pdf' ? (await pdf(req.file.buffer)).text : req.file.buffer.toString('utf8');
    } catch (e) {
      throw err('Could not parse uploaded file. Please ensure it is a valid, readable PDF or text document.');
    }
    if (!content.trim()) throw err('Could not read any text from this file');
  }
  if (!content && topic.trim().length < 2) throw err('Enter a topic, paste study material or upload a file');
  let level = difficulty, hint = '';
  if (difficulty === 'adaptive') {   // adapt to the user's recent performance
    const last = await QuizAttempt.find({ userId: req.userId }).sort({ completedAt: -1 }).limit(5);
    const avg = last.length ? last.reduce((s, a) => s + (a.percentage || 0), 0) / last.length : 60;
    level = avg < 50 ? 'easy' : avg < 80 ? 'medium' : 'hard';
    hint = `The learner's recent average is ${Math.round(avg)}%, so keep it ${level}.`;
  }
  const out = await ai.generate({ topic, content, count: n, difficulty: level, type, hint });
  const quiz = await Quiz.create({ userId: req.userId, title: out.title, topic: topic.trim() || out.title, difficulty: level,
    questionCount: out.questions.length, questions: out.questions });
  res.status(201).json(quiz);
};
exports.listQuizzes = async (req, res) => res.json(await Quiz.find({ userId: req.userId }).sort({ createdAt: -1 }).select('-questions'));
exports.getQuiz = async (req, res) => {
  const q = await Quiz.findById(req.params.id); if (!q) throw err('Quiz not found', 404); res.json(q);
};

const same = (a = [], b = []) => a.length === b.length && [...a].sort().join() === [...b].sort().join();
exports.submitAttempt = async (req, res) => {
  const { quizId, answers, timeTaken } = req.body, quiz = await Quiz.findById(quizId);
  if (!quiz || !Array.isArray(answers)) throw err('Invalid submission');
  const clean = quiz.questions.map((_, i) => {
    const raw = answers[i];
    if (Array.isArray(raw)) return raw.filter(Number.isInteger);
    if (Number.isInteger(raw)) return [raw];
    return [];
  });
  const correct = quiz.questions.filter((q, i) => same(q.correct, clean[i])).length;
  const total = quiz.questions.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const a = await QuizAttempt.create({
    userId: req.userId,
    quizId,
    score: correct,
    total,
    percentage,
    correctAnswers: correct,
    wrongAnswers: Math.max(0, total - correct),
    timeTaken: Math.max(0, Number(timeTaken) || 0),
    answers: clean
  });
  res.status(201).json(a);
};
exports.getAttempt = async (req, res) => {
  const a = await QuizAttempt.findOne({ _id: req.params.id, userId: req.userId }).populate('quizId');
  if (!a) throw err('Result not found', 404); res.json(a);
};
exports.history = async (req, res) =>
  res.json(await QuizAttempt.find({ userId: req.userId }).sort({ completedAt: -1 }).populate('quizId', 'title topic difficulty questionCount'));
exports.performance = async (req, res) => {
  const at = await QuizAttempt.find({ userId: req.userId }).sort({ completedAt: 1 }).populate('quizId', 'topic');
  const topics = {};
  at.forEach(a => {
    const t = a.quizId?.topic || 'General';
    (topics[t] ||= []).push(Number.isFinite(a.percentage) ? a.percentage : 0);
  });
  const avg = l => l.length ? Math.round(l.reduce((s, x) => s + x, 0) / l.length) : 0;
  const percentages = at.map(a => (Number.isFinite(a.percentage) ? a.percentage : 0));
  res.json({
    totalQuizzes: await Quiz.countDocuments({ userId: req.userId }),
    completed: at.length,
    average: avg(percentages),
    best: percentages.length ? Math.max(...percentages) : 0,
    scores: at.map(a => ({
      date: a.completedAt ? a.completedAt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      percentage: Number.isFinite(a.percentage) ? a.percentage : 0,
      topic: a.quizId?.topic || 'General'
    })),
    topics: Object.entries(topics).map(([topic, l]) => ({ topic, average: avg(l), attempts: l.length }))
  });
};
