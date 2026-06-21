import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Subjects from './pages/Subjects'
import { TestSubjects, TestTopics, TestQuestions, QuestionForm, ImportDocx } from './pages/tests'
import Payments from './pages/Payments'
import Users from './pages/Users'
import AuditLogs from './pages/AuditLogs'
import Notifications from './pages/Notifications'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8' }}>Yuklanmoqda...</div>
  if (!token) return <Navigate to="/login" />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="tests" element={<TestSubjects />} />
        <Route path="tests/:subjectId" element={<TestTopics />} />
        <Route path="tests/:subjectId/:topicId" element={<TestQuestions />} />
        <Route path="tests/:subjectId/:topicId/new" element={<QuestionForm />} />
        <Route path="tests/:subjectId/:topicId/import" element={<ImportDocx />} />
        <Route path="tests/:subjectId/:topicId/:questionId/edit" element={<QuestionForm />} />
        <Route path="payments" element={<Payments />} />
        <Route path="users" element={<Users />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
    </Routes>
  )
}
