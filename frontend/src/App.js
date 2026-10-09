import { Routes, Route, Navigate } from 'react-router-dom';
import { Protected } from './components/Layout';
import { Landing, Auth } from './pages/Public';
import { Dashboard, Performance, Profile } from './pages/Insights';
import { Generate, MyQuizzes, History } from './pages/Quizzes';
import { QuizPage, Result } from './pages/Take';
export default function App() {
  return <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Auth mode="login" />} /><Route path="/register" element={<Auth mode="register" />} />
    <Route element={<Protected />}>
      <Route path="/dashboard" element={<Dashboard />} /><Route path="/generate" element={<Generate />} />
      <Route path="/quizzes" element={<MyQuizzes />} /><Route path="/history" element={<History />} />
      <Route path="/performance" element={<Performance />} /><Route path="/profile" element={<Profile />} />
      <Route path="/quiz/:id" element={<QuizPage />} /><Route path="/result/:id" element={<Result />} />
    </Route>
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>;
}
