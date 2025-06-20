import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import ReactPlayer from "react-player"
import ImageViewer from "../components/ImageViewer"
import "./FileViewer.css"
import TextEditor from "../components/TextEditor"
import PDFViewer from "../components/PDFViewer"
import DocxViewer from "../components/DocxViewer"

type FileType = 
  | "image" 
  | "video" 
  | "audio" 
  | "docx" 
  | "presentation" 
  | "pdf" 
  | "text" 
  | "archive" 
  | "other"

interface FileData {
  id: string
  name: string
  mime: string
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
  accessLevel: string
}

const getFileType = (mime: string) : FileType => {
  const [type,subtype] = mime.split("/")
  switch (type){
    case "image":
      return "image"
    case "video":
      return "video"
    case "audio":
      return "audio"
    case "text":
      return "text"
    case "application":
      {
        if (subtype === "vnd.openxmlformats-officedocument.wordprocessingml.document")
          return "docx"

        if ([
          "vnd.ms-powerpoint",
          "vnd.openxmlformats-officedocument.presentationml.presentation"
        ].includes(subtype)) return "presentation"

        if (subtype === "pdf") return "pdf"
      }
    default:
      return "other"
  }
}
//тестовые данные
//пока что все данные о файлах статичные, возможно их будем получать через бэкенд
const exampleFileData: Record<string, FileData> = {
  "1": {
    id: "1",
    name: "Презентация.pptx",
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    size: "2.4 MB",
    modifiedDate: "2024-01-15",
    isFavorite: true,
    tags: ["работа", "презентация", "проект"],
    url: "/src/assets/example/files/presentation.pptx",
    accessLevel: "private",
  },
  "2": {
    id: "2",
    name: "Фото.jpg",
    mime: "image/jpg",
    size: "400 KB",
    modifiedDate: "2024-01-10",
    isFavorite: false,
    tags: ["отпуск", "фото", "личное"],
    url: "/src/assets/example/files/photo.jpg",
    metadata: {
      dimensions: { width: 1920, height: 1920 },
      format: "JPG",
    },
    accessLevel: "private",
  },
  "3": {
    id: "3",
    name: "Видео.mp4",
    mime: "video/mpeg",
    size: "1.06 MB",
    modifiedDate: "2024-01-08",
    isFavorite: true,
    tags: ["обучение", "видео"],
    url: "/src/assets/example/files/video.mp4",
    metadata: {
      duration: "00:00:15",
      dimensions: { width: 842, height: 480 },
      format: "MP4",
    },
    accessLevel: "private",
  },
  "4": {
    id: "4",
    name: "Документы.zip",
    mime: "application/zip",
    size: "12.1 MB",
    modifiedDate: "2024-01-05",
    isFavorite: false,
    tags: ["архив", "документы"],
    url: "/src/assets/example/files/documents.zip",
    accessLevel: "private"
  },
  "5": {
    id: "5",
    name: "Музыка.mp3",
    mime: "audio/mp3",
    size: "7.59 MB",
    modifiedDate: "2024-01-03",
    isFavorite: false,
    tags: ["музыка", "аудио"],
    url: "/src/assets/example/files/music.mp3",
    preview:"/src/assets/example/previews/music.jpg",
    metadata: {
      duration: "5:32",
      bitrate: "192 kbps",
      format: "MP3",
    },
    accessLevel: "private",
  },
  "6": {
    id: "6",
    name: "Документ.pdf",
    mime: "application/pdf",
    size: "1.8 MB",
    modifiedDate: "2024-01-01",
    isFavorite: true,
    tags: ["работа", "отчёт"],
    url: "/src/assets/example/files/report.pdf",
    accessLevel: "private",
  },
    "7": {
    id: "7",
    name: "Гифка.gif",
    mime: "image/gif",
    size: "1.8 MB",
    modifiedDate: "2024-01-01",
    isFavorite: true,
    tags: ["фото", "видео"],
    url: "/src/assets/example/files/gif-file.gif",
    metadata: {
      dimensions: { width: 640, height: 480 },
      format: "GIF",
    },
    accessLevel: "private",
  },
    "8": {
    id: "8",
    name: "Видео2.mp4",
    mime: "video/mpeg",
    size: "1.06 MB",
    modifiedDate: "2024-01-08",
    isFavorite: true,
    tags: ["обучение", "видео"],
    url: "/src/assets/example/files/video2.mp4",
    metadata: {
      duration: "00:00:15",
      dimensions: { width: 360, height: 656 },
      format: "MP4",
    },
    accessLevel: "private",
  },
  "9": {
    id: "9",
    name: "example.py",
    mime: "text/plain",
    size: "4 KB",
    modifiedDate: "2024-01-20",
    isFavorite: false,
    tags: ["документ", "текст"],
    url: "/src/assets/example/files/example.py",
    accessLevel: "private",
  },
  "10": {
    id: "10",
    name: "Вектор.svg",
    mime: "image/svg+xml",
    size: "1.8 MB",
    modifiedDate: "2024-01-01",
    isFavorite: true,
    tags: ["фото"],
    url: "/src/assets/example/files/image.svg",
    metadata: {
      dimensions: {width: 150, height: 150},
      format: "SVG",
    },
    accessLevel: "private",
  },
    "11": {
    id: "11",
    name: "Пиксель-арт.webp",
    mime: "image/webp",
    size: "452 B",
    modifiedDate: "2024-01-10",
    isFavorite: false,
    tags: ["фото"],
    url: "/src/assets/example/files/pixels.webp",
    metadata: {
      dimensions: { width: 48, height: 64 },
      format: "WEBP",
    },
    accessLevel: "public",
  },
  "12": {
    id: "12",
    name: "Документ.docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: "15 KB",
    modifiedDate: "2024-01-25",
    isFavorite: false,
    tags: ["документ", "работа"],
    url: "/src/assets/example/files/document.docx",
    accessLevel: "private",
  }
}

export default function FileViewer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [file, setFile] = useState(exampleFileData[id ?? "1"])
  const isAuthorized = true // Placeholder for admin state

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [showNotification])

  const handleAccessLevelChange = () => {
    setFile((prevFile) => ({
      ...prevFile,
      accessLevel: prevFile.accessLevel === "public" ? "private" : "public",
    }))
  }

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
  const type = getFileType(file.mime)
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
    switch (type) {
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
          </div>
        )

      case "video":
        const isVertical = (file.metadata?.dimensions?.height ?? 0) > (file.metadata?.dimensions?.width ?? 0);
        return (
          <div className="video-viewer">
            <ReactPlayer url={file.url} controls width={isVertical ? "auto" : "100%"}  style={{ maxHeight: "70vh" }} height={isVertical ? "100%" : "auto"}/>
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
      case "docx":
        return (
          <div className="document-viewer">
            <DocxViewer fileUrl={file.url} />
          </div>
        );
      case "pdf": 
        return (
          <div className="pdf-viewer">
            <PDFViewer src={file.url} fileName={file.name} onDownload={handleDownload} />
          </div>
        )
      case "text":
        return(
          <div className="text-viewer">
            <TextEditor 
              fileUrl={file.url}
              fileName={file.name}
              onSave={() => console.log("save")}
              isAuthorized={isAuthorized}
            />
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
            {isAuthorized && (
              <button className="action-button download-button">
                <img
                  src="/src/assets/icons/upload.png"
                  alt="Replace"
                  className="action-icon"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=16&width=16"
                  }}
                />
                Заменить
              </button>
            )}
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
            {(file.metadata || isAuthorized) && (
              <div className="file-metadata">
                {file.metadata && <h3>Информация о файле:</h3>}
                <div className="metadata-list">
                  {file.metadata?.duration && (
                    <div className="metadata-item">
                      <span className="metadata-label">Длительность:</span>
                      <span className="metadata-value">{file.metadata.duration}</span>
                    </div>
                  )}
                  {file.metadata?.resolution && (
                    <div className="metadata-item">
                      <span className="metadata-label">Разрешение:</span>
                      <span className="metadata-value">{file.metadata.resolution}</span>
                    </div>
                  )}
                  {file.metadata?.dimensions && (
                    <div className="metadata-item">
                      <span className="metadata-label">Размеры:</span>
                      <span className="metadata-value">
                        {file.metadata.dimensions.width} × {file.metadata.dimensions.height}
                      </span>
                    </div>
                  )}
                  {file.metadata?.bitrate && (
                    <div className="metadata-item">
                      <span className="metadata-label">Битрейт:</span>
                      <span className="metadata-value">{file.metadata.bitrate}</span>
                    </div>
                  )}
                  {file.metadata?.format && (
                    <div className="metadata-item">
                      <span className="metadata-label">Формат:</span>
                      <span className="metadata-value">{file.metadata.format}</span>
                    </div>
                  )}
                  {isAuthorized && (
                    <div className="metadata-item">
                      <span className="metadata-label">Уровень доступа:</span>
                      <div className="access-control">
                        <span className="metadata-value">{file.accessLevel === "public" ? "Публичный" : "Приватный"}</span>
                        <button onClick={handleAccessLevelChange} className="access-change-button">
                          Изменить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {isFullscreen && type === "image" && (
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
