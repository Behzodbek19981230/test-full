import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconSchool, IconLogin } from '@tabler/icons-react'
import { Button, Input } from '../components/ui'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setError('Noto\'g\'ri login yoki parol')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-box" onSubmit={handleSubmit}>
        <div className="login-header">
          <div className="login-logo"><IconSchool size={24} /></div>
          <h1>Test Market</h1>
          <p>Admin paneliga kirish</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <Input label="Login" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" required />
        <Input label="Parol" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />

        <Button variant="primary" fullWidth loading={loading} type="submit">
          <IconLogin size={18} /> Kirish
        </Button>
      </form>
    </div>
  )
}
