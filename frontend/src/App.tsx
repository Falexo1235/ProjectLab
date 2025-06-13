import { Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import FileViewer from "./pages/FileViewer"
import "./App.css"

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/example/:id" element={<FileViewer />} />
    </Routes>
  )
}

export default App
