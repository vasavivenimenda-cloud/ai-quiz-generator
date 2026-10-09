// Demo data: login with demo@quiz.com / demo123
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose'), bcrypt = require('bcryptjs'), { User, Quiz, QuizAttempt } = require('./models');
const mk = (question, options, correct, explanation, difficulty = 'easy') => ({
  question,
  type: correct.length > 1 ? 'multi' : options.length === 2 ? 'tf' : 'mcq',
  options,
  correct,
  explanation,
  difficulty
});

const topics = {
  'Photosynthesis': [
    mk('Which organelle carries out photosynthesis?', ['Mitochondrion', 'Chloroplast', 'Ribosome', 'Nucleus'], [1], 'Chloroplasts contain chlorophyll.'),
    mk('Plants release oxygen during photosynthesis.', ['True', 'False'], [0], 'Oxygen is a by-product of splitting water.'),
    mk('Which are inputs of photosynthesis?', ['Water', 'Carbon dioxide', 'Oxygen', 'Glucose'], [0, 1], 'Water and CO2 are consumed; O2 and glucose are produced.')
  ],
  'Data Structures': [
    mk('Which structure is LIFO?', ['Queue', 'Stack', 'Heap', 'Graph'], [1], 'A stack pops the last item pushed.', 'medium'),
    mk('Binary search needs sorted data.', ['True', 'False'], [0], 'It halves a sorted range each step.', 'medium'),
    mk('Which have O(1) average lookup?', ['Hash table', 'Linked list', 'Array by index', 'BST'], [0, 2], 'Hash tables and indexed arrays give constant-time access.', 'medium')
  ]
};

(async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-quiz-generator';
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB. Seeding demo user and quiz records...');
    await User.deleteOne({ email: 'demo@quiz.com' });
    const u = await User.create({ name: 'Demo Student', email: 'demo@quiz.com', password: await bcrypt.hash('demo123', 10) });
    let day = 6;
    for (const [t, questions] of Object.entries(topics)) {
      const q = await Quiz.create({ userId: u._id, title: t + ' Basics', topic: t, difficulty: questions[0].difficulty, questionCount: 3, questions });
      for (const right of [1, 2, 3]) {
        const answers = questions.map((x, i) => (i < right ? x.correct : [9]));
        await QuizAttempt.create({
          userId: u._id,
          quizId: q._id,
          score: right,
          total: 3,
          percentage: Math.round(right / 3 * 100),
          correctAnswers: right,
          wrongAnswers: 3 - right,
          timeTaken: 40 + right * 10,
          answers,
          completedAt: new Date(Date.now() - 864e5 * day--)
        });
      }
    }
    console.log('Seeding completed successfully!');
    console.log('Login credentials:');
    console.log('   Email: demo@quiz.com');
    console.log('Password: demo123');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    console.error('Ensure MongoDB is running or check MONGO_URI in backend/.env');
    process.exit(1);
  }
})();

