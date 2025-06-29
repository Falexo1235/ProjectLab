import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { getApiUrl } from "../config/api"
import "./LoginPage.css"

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const response = await fetch(getApiUrl("/api/v1/Users/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data?.message || "Ошибка входа. Проверьте данные.")
        setLoading(false)
        return
      }
      const data = await response.json()
      localStorage.setItem("token", data.token)
      localStorage.setItem("refreshToken", data.refreshToken)
    navigate("/")
    } catch (err) {
      setError("Ошибка сети. Попробуйте позже.")
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1 className="login-title">Booble Drive</h1>
          <p className="login-subtitle">Вход в аккаунт</p>
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="login-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            className="login-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div style={{ color: "#e74c3c", fontSize: 14 }}>{error}</div>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
        <div style={{ marginTop: 16, fontSize: 14 }}>
          Нет аккаунта?{' '}
          <span style={{ color: "#3b82f6", cursor: "pointer" }} onClick={() => navigate("/register")}>Зарегистрироваться</span>
        </div>
      </div>
    </div>
  )
} 