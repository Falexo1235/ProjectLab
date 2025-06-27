import React, { useState, useEffect } from "react"
import "./ShareModal.css"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  fileId: string
  fileName: string
  currentVisibility?: "Private" | "Shared" | "Public"
  onCreateLink: (password?: string, expiresAt?: Date) => Promise<{ url: string }>
  onDeleteLink: () => Promise<void>
  onVisibilityChange?: (visibility: "Private" | "Shared" | "Public") => Promise<void>
  hasExistingLink?: boolean
}

export default function ShareModal({
  isOpen,
  onClose,
  fileId,
  fileName,
  currentVisibility = "Private",
  onCreateLink,
  onDeleteLink,
  onVisibilityChange,
  hasExistingLink = false
}: ShareModalProps) {
  const [password, setPassword] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [visibility, setVisibility] = useState<"Private" | "Shared" | "Public">(currentVisibility)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setVisibility(currentVisibility)
  }, [currentVisibility])

  const handleCreateLink = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setError("")
    
    try {
      const expiresDate = expiresAt ? new Date(expiresAt) : undefined
      const result = await onCreateLink(password || undefined, expiresDate)
      
      const fullUrl = `${window.location.origin}${result.url}`
      await navigator.clipboard.writeText(fullUrl)
      
      setPassword("")
      setExpiresAt("")
    } catch (e) {
      setError("Ошибка при создании ссылки")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteLink = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setError("")
    
    try {
      await onDeleteLink()
    } catch (e) {
      setError("Ошибка при удалении ссылки")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVisibilityChange = async (newVisibility: "Private" | "Shared" | "Public") => {
    if (isLoading || newVisibility === visibility) return
    
    setIsLoading(true)
    setError("")
    
    try {
      await onVisibilityChange?.(newVisibility)
      setVisibility(newVisibility)
    } catch (e) {
      setError("Ошибка при изменении видимости")
      setVisibility(visibility)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyDirectLink = async () => {
    try {
      const directUrl = `${window.location.origin}/file/${fileId}`
      await navigator.clipboard.writeText(directUrl)
    } catch (e) {
      setError("Ошибка при копировании ссылки")
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setPassword("")
      setExpiresAt("")
      setError("")
      setVisibility(currentVisibility)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="share-modal-overlay" onClick={handleClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h2>Поделиться файлом</h2>
          <button className="share-modal-close" onClick={handleClose}>
            ×
          </button>
        </div>
        
        <div className="share-modal-content">
          <div className="share-file-info">
            <span className="share-file-name">{fileName}</span>
          </div>
          
          {error && <div className="share-error">{error}</div>}
          
          <div className="share-form">
            <div className="form-group">
              <label>Видимость файла</label>
              <div className="visibility-select-container">
                <select
                  value={visibility}
                  onChange={(e) => handleVisibilityChange(e.target.value as "Private" | "Shared" | "Public")}
                  disabled={isLoading}
                  className="filter-select"
                >
                  <option value="Private">Приватный</option>
                  <option value="Shared">По ссылке</option>
                  <option value="Public">Публичный</option>
                </select>
                <button
                  className="copy-direct-link-button"
                  onClick={handleCopyDirectLink}
                  disabled={isLoading}
                  title="Скопировать прямую ссылку"
                >
                  <img
                    src="/src/assets/icons/link.png"
                    alt="Копировать ссылку"
                    className="copy-link-icon"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=16&width=16"
                    }}
                  />
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Пароль (необязательно)</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль для доступа"
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="expiresAt">Дата истечения (необязательно)</label>
              <input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="share-actions">
              <button
                className="share-button share-button-create"
                onClick={handleCreateLink}
                disabled={isLoading}
              >
                {isLoading ? "Создание..." : "Создать ссылку"}
              </button>
              
              <button
                className="share-button share-button-delete"
                onClick={handleDeleteLink}
                disabled={isLoading}
              >
                {isLoading ? "Удаление..." : "Удалить ссылку"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 