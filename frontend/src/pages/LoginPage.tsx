import { useNavigate } from "react-router-dom"
import "./LoginPage.css"

export default function LoginPage() {
  const navigate = useNavigate()

  const handleLogin = () => {
    console.log("Login attempt with key...")
    navigate("/")
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1 className="login-title">Booble Drive</h1>
          <p className="login-subtitle">Вход для администратора</p>
        </div>
        <div className="login-form">
          <input
            type="password"
            placeholder="Введите ключ доступа"
            className="login-input"
          />
          <button onClick={handleLogin} className="login-button">
            Войти
          </button>
        </div>
      </div>
    </div>
  )
} 