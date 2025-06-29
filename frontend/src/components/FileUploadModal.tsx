import { useRef, useState } from "react"
import "./FileUploadModal.css"
import { getApiUrl } from "../config/api"

interface FileUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: () => void
}

export default function FileUploadModal({ isOpen, onClose, onUploadSuccess }: FileUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [extension, setExtension] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const splitFileName = (fullName: string) => {
    const lastDotIndex = fullName.lastIndexOf('.')
    if (lastDotIndex === -1) {
      return { name: fullName, extension: '' }
    }
    return {
      name: fullName.substring(0, lastDotIndex),
      extension: fullName.substring(lastDotIndex)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
    if (f) {
      const { name, extension } = splitFileName(f.name)
      setName(name)
      setExtension(extension)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!file) {
      setError("Выберите файл для загрузки.")
      return
    }
    if (!name.trim()) {
      setError("Название файла не может быть пустым.")
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("File", file)
      formData.append("Name", name.trim() + extension)
      if (description) formData.append("Description", description)
      const token = localStorage.getItem("token")
      const response = await fetch(getApiUrl("/api/v1/Files/upload"), {
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
      setExtension("")
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
          <div className="upload-name-container">
          <input
            type="text"
            placeholder="Имя файла"
            value={name}
            onChange={e => setName(e.target.value)}
              className="upload-input upload-name-input"
            disabled={loading}
          />
            <span className="upload-extension">{extension}</span>
          </div>
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