import { useRef, useState } from "react"
import "./FileUploadModal.css"

interface FileUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: () => void
}

export default function FileUploadModal({ isOpen, onClose, onUploadSuccess }: FileUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
    if (f) setName(f.name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!file) {
      setError("Выберите файл для загрузки.")
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("File", file)
      if (name) formData.append("Name", name)
      if (description) formData.append("Description", description)
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:5107/api/v1/Files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })
      if (!response.ok) {
        setError("Ошибка загрузки файла. Попробуйте позже.")
        setLoading(false)
        return
      }
      setLoading(false)
      onUploadSuccess()
      onClose()
      setFile(null)
      setName("")
      setDescription("")
    } catch (e) {
      setError("Ошибка сети. Попробуйте позже.")
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Загрузка файла</h2>
        <form className="upload-form" onSubmit={handleSubmit}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="*"
            className="upload-input"
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Имя файла"
            value={name}
            onChange={e => setName(e.target.value)}
            className="upload-input"
            disabled={loading}
          />
          <textarea
            placeholder="Описание (необязательно)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="upload-input"
            disabled={loading}
          />
          {error && <div className="upload-error">{error}</div>}
          <div className="upload-actions">
            <button type="button" className="upload-cancel" onClick={onClose} disabled={loading}>Отмена</button>
            <button type="submit" className="upload-submit" disabled={loading}>{loading ? "Загрузка..." : "Загрузить"}</button>
          </div>
        </form>
      </div>
    </div>
  )
} 