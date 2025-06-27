import { Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import FileViewer from "./pages/FileViewer"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import "./App.css"

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/file/:id" element={<FileViewer />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  )
}

export default App
