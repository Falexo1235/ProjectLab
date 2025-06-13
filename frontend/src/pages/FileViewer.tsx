import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import ReactPlayer from "react-player"
import ImageViewer from "../components/ImageViewer"
import "./FileViewer.css"
import PDFViewer from "../components/PDFViewer"

interface FileData {
  id: string
  name: string
  type: "image" | "video" | "audio" | "document" | "archive" | "other" | "pdf"
  size: string
  modifiedDate: string
  isFavorite: boolean
  tags: string[]
  url: string
  preview?: string
  metadata?: {
    duration?: string
    resolution?: string
    dimensions?: { width: number; height: number }
    bitrate?: string
    format?: string
  }
}

//тестовые данные
//пока что все данные о файлах статичные, возможно их будем получать через бэкенд
const exampleFileData: Record<string, FileData> = {
  "1": {
    id: "1",
    name: "Презентация проекта.pptx",
    type: "document",
    size: "2.4 MB",
    modifiedDate: "2024-01-15",
    isFavorite: true,
    tags: ["работа", "презентация", "проект"],
    url: "/src/assets/example/files/presentation.pptx",
  },
  "2": {
    id: "2",
    name: "Фото отпуска.jpg",
    type: "image",
    size: "5.2 MB",
    modifiedDate: "2024-01-10",
    isFavorite: false,
    tags: ["отпуск", "фото", "личное"],
    url: "/src/assets/example/files/vacation-photo.jpg",
    metadata: {
      resolution: "4K",
      dimensions: { width: 3840, height: 2160 },
      format: "JPEG",
    },
  },
  "3": {
    id: "3",
    name: "Видео.mp4",
    type: "video",
    size: "45.8 MB",
    modifiedDate: "2024-01-08",
    isFavorite: true,
    tags: ["обучение", "видео"],
    url: "/src/assets/example/files/video-lesson.mp4",
    metadata: {
      duration: "5:32",
      resolution: "1080p",
      dimensions: { width: 1920, height: 1080 },
      format: "MP4",
    },
  },
  "4": {
    id: "4",
    name: "Документы.zip",
    type: "archive",
    size: "12.1 MB",
    modifiedDate: "2024-01-05",
    isFavorite: false,
    tags: ["архив", "документы"],
    url: "/src/assets/example/files/documents.zip",
  },
  "5": {
    id: "5",
    name: "Музыка.mp3",
    type: "audio",
    size: "8.7 MB",
    modifiedDate: "2024-01-03",
    isFavorite: false,
    tags: ["музыка", "аудио"],
    url: "/src/assets/example/files/music.mp3",
    preview:"/src/assets/example/previews/music.jpg",
    metadata: {
      duration: "3:45",
      bitrate: "320 kbps",
      format: "MP3",
    },
  },
  "6": {
    id: "6",
    name: "Документ.pdf",
    type: "pdf",
    size: "1.8 MB",
    modifiedDate: "2024-01-01",
    isFavorite: true,
    tags: ["работа", "отчёт"],
    url: "/src/assets/example/files/report.pdf",
  },
    "7": {
    id: "7",
    name: "Гифка.gif",
    type: "image",
    size: "1.8 MB",
    modifiedDate: "2024-01-01",
    isFavorite: true,
    tags: ["фото", "видео"],
    url: "/src/assets/example/files/gif-file.gif",
  },
}

export default function FileViewer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  const file = id ? exampleFileData[id] : null

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [showNotification])

  if (!file) {
    return (
      <div className="file-viewer-container">
        <div className="file-viewer-content">
          <div className="file-not-found">
            <img
              src="/src/assets/icons/empty.png"
              alt="Empty"
              className="file-empty-icon"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=120&width=120"
              }}
            />
            <h1>Файл не найден</h1>
            <p>Файл с ID "{id}" не существует или был удален.</p>
            <button onClick={() => navigate("/")} className="back-button">
              Вернуться к списку файлов
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleShare = async () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setShowNotification(true)
  }

  const handleFullscreenClose = () => {
    setIsFullscreen(false)
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderFileContent = () => {
    switch (file.type) {
      case "image":
        return (
          <div className="image-viewer">
            <img
              src={file.url || "/placeholder.svg"}
              alt={file.name}
              className="main-image"
              onClick={() => setIsFullscreen(true)}
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=400&width=600"
              }}
            />
            <p className="image-hint">Нажмите на изображение для полноэкранного просмотра</p>
          </div>
        )

      case "video":
        return (
          <div className="video-viewer">
            <ReactPlayer url={file.url} controls width="100%" height="auto" style={{ maxHeight: "70vh" }} />
          </div>
        )

      case "audio":
        return (
          <div className="audio-viewer">
            <div className="audio-placeholder">
              <img
                src={file.preview}
                alt="Audio"
                className="audio-icon"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=120&width=120"
                }}
              />
              <h3>{file.name}</h3>
            </div>
            <ReactPlayer url={file.url} controls width="100%" height="60px" />
          </div>
        )
      case "pdf": 
        return (
          <div className="pdf-viewer">
            <PDFViewer src={file.url} fileName={file.name} onDownload={handleDownload} />
          </div>
        )
      default:
        return (
          <div className="unsupported-viewer">
            <img
              src="/src/assets/icons/warning.png"
              alt="Warning"
              className="file-icon"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=120&width=120"
              }}
            />
            <h3>Предварительный просмотр недоступен</h3>
            <p>Этот тип файла не поддерживается для просмотра в браузере.</p>
          </div>
        )
    }
  }

  return (
    <div className="file-viewer-container">
      {showNotification && (
        <div className="copy-notification">
          <div className="notification-content">
            <span className="notification-icon">✓</span>
            <span className="notification-text">Ссылка скопирована в буфер обмена</span>
          </div>
        </div>
      )}
      <div className="file-viewer-content">
        <div className="file-viewer-header">
          <button onClick={() => navigate("/")} className="back-button">
            ← Назад к файлам
          </button>
          <div className="file-actions">
            <button onClick={handleShare} className="action-button share-button">
              <img
                src="/src/assets/icons/share.png"
                alt="Share"
                className="action-icon"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=16&width=16"
                }}
              />
              Поделиться
            </button>
            <button onClick={handleDownload} className="action-button download-button">
              <img
                src="/src/assets/icons/download.png"
                alt="Download"
                className="action-icon"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=16&width=16"
                }}
              />
              Скачать
            </button>
          </div>
        </div>
        <div className="file-content">{renderFileContent()}</div>
        <div className="file-info-panel">
          <div className="file-details">
            <h2 className="file-title">{file.name}</h2>
            <div className="file-meta">
              <span className="file-size">{file.size}</span>
              <span className="file-date">Изменен: {new Date(file.modifiedDate).toLocaleDateString("ru-RU")}</span>
            </div>
            {file.tags.length > 0 && (
              <div className="file-tags">
                <h3>Теги:</h3>
                <div className="tags-list">
                  {file.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {file.metadata && (
              <div className="file-metadata">
                <h3>Информация о файле:</h3>
                <div className="metadata-list">
                  {file.metadata.duration && (
                    <div className="metadata-item">
                      <span className="metadata-label">Длительность:</span>
                      <span className="metadata-value">{file.metadata.duration}</span>
                    </div>
                  )}
                  {file.metadata.resolution && (
                    <div className="metadata-item">
                      <span className="metadata-label">Разрешение:</span>
                      <span className="metadata-value">{file.metadata.resolution}</span>
                    </div>
                  )}
                  {file.metadata.dimensions && (
                    <div className="metadata-item">
                      <span className="metadata-label">Размеры:</span>
                      <span className="metadata-value">
                        {file.metadata.dimensions.width} × {file.metadata.dimensions.height}
                      </span>
                    </div>
                  )}
                  {file.metadata.bitrate && (
                    <div className="metadata-item">
                      <span className="metadata-label">Битрейт:</span>
                      <span className="metadata-value">{file.metadata.bitrate}</span>
                    </div>
                  )}
                  {file.metadata.format && (
                    <div className="metadata-item">
                      <span className="metadata-label">Формат:</span>
                      <span className="metadata-value">{file.metadata.format}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {isFullscreen && file.type === "image" && (
        <div className="fullscreen-overlay" onClick={handleFullscreenClose}>
          <button className="fullscreen-close" onClick={handleFullscreenClose}>
            X
          </button>
          <div className="fullscreen-content">
            <ImageViewer
              src={file.url || "/placeholder.svg"}
              alt={file.name}
              onClose={handleFullscreenClose}
            />
          </div>
        </div>
      )}
    </div>
  )
}
