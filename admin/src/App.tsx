import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Subjects from './pages/Subjects'
import { TestSubjects, TestTopics, TestQuestions, QuestionForm, ImportDocx } from './pages/tests'
import Payments from './pages/Payments'
import Variants from './pages/Variants'
import Users from './pages/Users'
import AdminUsers from './pages/AdminUsers'
import AuditLogs from './pages/AuditLogs'
import Notifications from './pages/Notifications'
import Materials from './pages/Materials'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8' }}>Yuklanmoqda...</div>
  if (!token) return <Navigate to="/login" />
  return <>{children}</>
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { admin } = useAuth()
  if (admin?.role !== 'admin' && admin?.role !== 'superadmin') return <Navigate to="/" />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<AdminOnly><Dashboard /></AdminOnly>} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="tests" element={<TestSubjects />} />
        <Route path="tests/:subjectId" element={<TestTopics />} />
        <Route path="tests/:subjectId/:topicId" element={<TestQuestions />} />
        <Route path="tests/:subjectId/:topicId/new" element={<QuestionForm />} />
        <Route path="tests/:subjectId/:topicId/import" element={<ImportDocx />} />
        <Route path="tests/:subjectId/:topicId/:questionId/edit" element={<QuestionForm />} />
        <Route path="payments" element={<AdminOnly><Payments /></AdminOnly>} />
        <Route path="variants" element={<AdminOnly><Variants /></AdminOnly>} />
        <Route path="users" element={<AdminOnly><Users /></AdminOnly>} />
        <Route path="admin-users" element={<AdminOnly><AdminUsers /></AdminOnly>} />
        <Route path="audit" element={<AdminOnly><AuditLogs /></AdminOnly>} />
        <Route path="notifications" element={<AdminOnly><Notifications /></AdminOnly>} />
        <Route path="materials/:subjectId" element={<Materials />} />
      </Route>
    </Routes>
  )
}
