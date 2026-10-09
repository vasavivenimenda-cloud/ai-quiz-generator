const { Schema, model, Types } = require('mongoose');
const User = model('User', new Schema({
  name: { type: String, required: true, trim: true }, email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, createdAt: { type: Date, default: Date.now } }));
const Quiz = model('Quiz', new Schema({
  userId: { type: Types.ObjectId, ref: 'User', index: true }, title: String, topic: String, difficulty: String, questionCount: Number,
  questions: [{ question: String, type: String, options: [String], correct: [Number], explanation: String, difficulty: String }],
  createdAt: { type: Date, default: Date.now } }));
const QuizAttempt = model('QuizAttempt', new Schema({
  userId: { type: Types.ObjectId, ref: 'User', index: true }, quizId: { type: Types.ObjectId, ref: 'Quiz' },
  score: Number, total: Number, percentage: Number, correctAnswers: Number, wrongAnswers: Number, timeTaken: Number,
  answers: [[Number]], completedAt: { type: Date, default: Date.now } }));
module.exports = { User, Quiz, QuizAttempt };
