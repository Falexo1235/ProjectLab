import React, { useState } from "react"
import "./ShareModal.css"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  fileId: string
  fileName: string
  onCreateLink: (password?: string, expiresAt?: Date) => Promise<{ url: string }>
  onDeleteLink: () => Promise<void>
  hasExistingLink?: boolean
}

export default function ShareModal({
  isOpen,
  onClose,
  fileId,
  fileName,
  onCreateLink,
  onDeleteLink,
  hasExistingLink = false
}: ShareModalProps) {
  const [password, setPassword] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)

  const handleCreateLink = async () => {
    if (isLoading) return
    setIsLoading(true)
    setError("")
    try {
      const expiresDate = expiresAt ? new Date(expiresAt) : undefined
      const result = await onCreateLink(password || undefined, expiresDate)
      const fullUrl = `${window.location.origin}${result.url.replace('/p/', '/pub/')}`
      await navigator.clipboard.writeText(fullUrl)
      setCreatedUrl(fullUrl)
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
      setCreatedUrl(null)
    } catch (e) {
      setError("Ошибка при удалении ссылки")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setPassword("")
      setExpiresAt("")
      setError("")
      setCreatedUrl(null)
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
                {isLoading ? "Создание..." : "Создать публичную ссылку"}
              </button>
              {hasExistingLink && (
                <button
                  className="share-button share-button-delete"
                  onClick={handleDeleteLink}
                  disabled={isLoading}
                >
                  {isLoading ? "Удаление..." : "Удалить ссылку"}
                </button>
              )}
            </div>
            {createdUrl && (
              <div className="share-link-info">
                <span>Ссылка скопирована:</span>
                <a href={createdUrl} target="_blank" rel="noopener noreferrer">{createdUrl}</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 