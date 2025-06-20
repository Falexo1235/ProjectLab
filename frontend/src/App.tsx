import { Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import FileViewer from "./pages/FileViewer"
import LoginPage from "./pages/LoginPage"
import "./App.css"

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/example/:id" element={<FileViewer />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  )
}

export default App
